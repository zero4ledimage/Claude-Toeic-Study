// 12 週進度追蹤儀表板

const Dashboard = {
  mount(container) {
    this.container = container;
    this.render();
  },

  render() {
    const container = this.container;
    const startDate = Storage.getStartDate();
    const currentWeek = Storage.getCurrentWeek();
    const phase = PLAN_PHASES.find((p) => p.weeks.includes(currentWeek));
    const weekInfo = PLAN_WEEKS.find((w) => w.week === currentWeek);

    container.innerHTML = `
      <div class="card">
        <h2>12 週進度儀表板</h2>
        <div class="field-inline">
          <label class="field-label">計畫開始日期</label>
          <input type="date" id="start-date-input" value="${startDate}">
        </div>
        <div class="current-week-banner">
          <div class="cw-week">第 ${currentWeek} 週</div>
          <div class="cw-phase">${phase ? phase.name : ""}</div>
          <div class="cw-title">${weekInfo ? weekInfo.title : ""}</div>
        </div>
        ${weekInfo ? `<ul class="focus-list">${weekInfo.focus.map((f) => `<li>${f}</li>`).join("")}</ul>` : ""}
      </div>

      <div class="card">
        <h3>模考分數趨勢(990 分制)</h3>
        <p class="muted">可記錄官方模考成績,或依本工具模考正確率自行估算的參考分數。</p>
        <div class="field-inline">
          <input type="number" id="score-input" min="10" max="990" step="5" placeholder="輸入分數,例如 620">
          <input type="text" id="score-label" placeholder="備註(選填,如:官方模考)">
          <button class="btn-primary" id="score-add-btn">新增紀錄</button>
        </div>
        <div id="score-chart" class="chart-area"></div>
      </div>

      <div class="card">
        <h3>每週學習時數</h3>
        <div class="field-inline">
          <input type="number" id="hours-input" min="0" max="24" step="0.5" placeholder="本次讀了幾小時">
          <input type="text" id="hours-note" placeholder="備註(選填)">
          <button class="btn-primary" id="hours-add-btn">記錄時數</button>
        </div>
        <div id="hours-chart" class="chart-area"></div>
      </div>

      <div class="card">
        <h3>12 週計畫總覽</h3>
        <div id="plan-table"></div>
      </div>
    `;

    container.querySelector("#start-date-input").addEventListener("change", (e) => {
      Storage.setStartDate(e.target.value);
      this.render();
    });
    container.querySelector("#score-add-btn").addEventListener("click", () => {
      const val = container.querySelector("#score-input").value;
      if (!val) return;
      Storage.addScoreLog(val, container.querySelector("#score-label").value);
      this.render();
    });
    container.querySelector("#hours-add-btn").addEventListener("click", () => {
      const val = container.querySelector("#hours-input").value;
      if (!val) return;
      Storage.addHourLog(val, container.querySelector("#hours-note").value);
      this.render();
    });

    this.renderScoreChart(container.querySelector("#score-chart"));
    this.renderHoursChart(container.querySelector("#hours-chart"));
    this.renderPlanTable(container.querySelector("#plan-table"), currentWeek);
  },

  renderScoreChart(el) {
    const log = Storage.getScoreLog();
    if (log.length === 0) {
      el.innerHTML = `<p class="muted">尚無紀錄。</p>`;
      return;
    }
    el.innerHTML = log
      .map((entry) => {
        const width = Math.min((entry.score / 990) * 100, 100);
        return `
        <div class="chart-row">
          <span class="chart-row-label">第${entry.week}週 ${entry.date}</span>
          <div class="chart-bar-track"><div class="chart-bar score-bar" style="width:${width}%"></div></div>
          <span class="chart-row-value">${entry.score}${entry.label ? " · " + entry.label : ""}</span>
        </div>`;
      })
      .join("");
  },

  renderHoursChart(el) {
    const rows = PLAN_WEEKS.map((w) => {
      const actual = Storage.getHoursForWeek(w.week);
      const width = Math.min((actual / w.targetHours) * 100, 100);
      return `
        <div class="chart-row">
          <span class="chart-row-label">第${w.week}週</span>
          <div class="chart-bar-track"><div class="chart-bar hours-bar" style="width:${width}%"></div></div>
          <span class="chart-row-value">${actual} / ${w.targetHours} h</span>
        </div>`;
    }).join("");
    el.innerHTML = rows;
  },

  renderPlanTable(el, currentWeek) {
    const rows = PLAN_WEEKS.map((w) => {
      const phase = PLAN_PHASES.find((p) => p.weeks.includes(w.week));
      const isCheckpoint = phase && phase.checkpoint.week === w.week;
      const isCurrent = w.week === currentWeek;
      const bestScore = Storage.getScoreLog().length
        ? Math.max(...Storage.getScoreLog().map((s) => s.score))
        : 0;
      let checkpointHtml = "";
      if (isCheckpoint) {
        const met = bestScore >= phase.checkpoint.targetScore;
        checkpointHtml = `<span class="checkpoint-badge ${met ? "checkpoint-met" : "checkpoint-pending"}">🎯 Checkpoint ${phase.checkpoint.label} ${met ? "已達成" : "未達成"}</span>`;
      }
      return `
        <div class="plan-row ${isCurrent ? "plan-row-current" : ""}">
          <div class="plan-row-week">第 ${w.week} 週</div>
          <div class="plan-row-body">
            <div class="plan-row-title">${w.title} <span class="phase-tag">${phase ? phase.name : ""}</span></div>
            <ul class="focus-list">${w.focus.map((f) => `<li>${f}</li>`).join("")}</ul>
            ${checkpointHtml}
          </div>
        </div>`;
    }).join("");
    el.innerHTML = rows;
  }
};
