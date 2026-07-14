/**
 * 進度追蹤儀表板(需求文件 3.6 節五項功能 + 3.9 節 API 預算視覺化)
 */

const SKILL_LABELS = {
  reading: "閱讀", listening: "聽力", writing: "寫作", speaking: "口說", overall: "總分"
};
const TIME_SLOT_LABELS = {
  weekday_fragment: "週間白天零碎", weekday_evening: "週間晚上完整", weekend: "週末完整"
};

const Dashboard = {
  mount(container) {
    this.container = container;
    this.render();
  },

  render() {
    this.container.innerHTML = `
      <div class="card">
        <h2>新增模考成績</h2>
        <div class="field-inline">
          <select id="db-test-type"><option value="toeic">多益 TOEIC</option><option value="ielts">雅思 IELTS</option></select>
          <select id="db-skill">
            <option value="overall">總分</option>
            <option value="reading">閱讀</option>
            <option value="listening">聽力</option>
            <option value="writing">寫作</option>
            <option value="speaking">口說</option>
          </select>
          <input type="number" id="db-score" step="0.5" placeholder="分數">
          <select id="db-source"><option value="official_mock">官方模考</option><option value="self_practice">自我練習</option></select>
          <button class="btn-primary" id="db-add-score-btn">新增</button>
        </div>
      </div>

      <div class="card">
        <h2>分數趨勢與目標達成路徑</h2>
        <p class="muted">多益 750 目標(${CONFIG.EXAM_DATES.TOEIC} 應考)的參考路徑,對照你實際的模考成績。</p>
        <div id="db-score-trend"></div>
      </div>

      <div class="card">
        <h2>弱點分布</h2>
        <div id="db-weakness"></div>
      </div>

      <div class="card">
        <h2>本週 AI 摘要</h2>
        <button class="btn-secondary" id="db-summary-btn">產生本週摘要(Haiku 4.5)</button>
        <div id="db-summary-result" class="muted"></div>
      </div>

      <div class="card">
        <h2>讀書時數與一致性</h2>
        <div class="field-inline">
          <input type="number" id="db-duration" min="1" placeholder="分鐘">
          <select id="db-timeslot">
            <option value="weekday_fragment">週間白天零碎</option>
            <option value="weekday_evening">週間晚上完整</option>
            <option value="weekend">週末完整</option>
          </select>
          <input type="text" id="db-skill-focus" placeholder="這次做了什麼(選填)">
          <button class="btn-primary" id="db-add-session-btn">記錄</button>
        </div>
        <div id="db-consistency"></div>
      </div>

      <div class="card">
        <h2>API 預算與每日開銷</h2>
        <div id="db-budget"></div>
      </div>
    `;

    this.container.querySelector("#db-add-score-btn").addEventListener("click", () => {
      const score = this.container.querySelector("#db-score").value;
      if (!score) return;
      DataStore.addProgressRecord({
        test_type: this.container.querySelector("#db-test-type").value,
        skill: this.container.querySelector("#db-skill").value,
        score: Number(score),
        source: this.container.querySelector("#db-source").value
      });
      this.render();
    });
    this.container.querySelector("#db-add-session-btn").addEventListener("click", () => {
      const duration = this.container.querySelector("#db-duration").value;
      if (!duration) return;
      DataStore.addStudySession({
        duration_minutes: Number(duration),
        time_slot_type: this.container.querySelector("#db-timeslot").value,
        phase: 1,
        skill_focus: this.container.querySelector("#db-skill-focus").value
      });
      this.render();
    });
    this.container.querySelector("#db-summary-btn").addEventListener("click", () => this.generateWeeklySummary());

    this.renderScoreTrend();
    this.renderWeakness();
    this.renderConsistency();
    this.renderBudget();
    this.renderCachedSummary();
  },

  // ---------- 功能一+二:分數趨勢 + 目標達成路徑對照 ----------
  renderScoreTrend() {
    const el = this.container.querySelector("#db-score-trend");
    const records = DataStore.getAll("progressRecords")
      .filter((r) => r.test_type === "toeic" && r.skill === "overall")
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    const startDate = new Date("2026-07-01");
    const examDate = new Date(CONFIG.EXAM_DATES.TOEIC);
    const baseline = CONFIG.BASELINE_SCORES.TOEIC_READING_LISTENING;
    const target = CONFIG.TARGET_SCORES.TOEIC;
    const today = new Date();
    const progressRatio = clamp01((today - startDate) / (examDate - startDate));
    const expectedToday = Math.round(baseline + (target - baseline) * progressRatio);

    let html = `<div class="target-path-summary">依時程推算,今天(${today.toISOString().slice(0, 10)})應落在約 <strong>${expectedToday}</strong> 分左右(從 ${baseline} → ${target},${CONFIG.EXAM_DATES.TOEIC} 應考)。</div>`;

    if (records.length === 0) {
      html += `<p class="muted">尚無多益總分模考紀錄。</p>`;
    } else {
      const maxScore = 990;
      html += `<div class="chart-area">`;
      records.forEach((r) => {
        const width = (r.score / maxScore) * 100;
        const diff = r.score - expectedRatioScore(r.date, startDate, examDate, baseline, target);
        const diffLabel = diff >= 0 ? `領先 ${Math.round(diff)} 分` : `落後 ${Math.round(-diff)} 分`;
        html += `
          <div class="chart-row">
            <span class="chart-row-label">${r.date}</span>
            <div class="chart-bar-track"><div class="chart-bar score-bar" style="width:${width}%"></div></div>
            <span class="chart-row-value">${r.score}(${diffLabel}）</span>
          </div>`;
      });
      html += `</div>`;
    }
    const selfRecords = DataStore.getAll("progressRecords")
      .filter((r) => r.source === "self_practice" && r.test_type === "toeic")
      .slice(-5)
      .reverse();
    if (selfRecords.length) {
      html += `<div class="target-path-summary" style="margin-top:0.6rem;">本地練習模考估分(僅供參考、<strong>非官方分數</strong>,詳見「測驗練習」分頁):<br>${selfRecords
        .map((r) => `${escapeHtml(r.date)}:閱讀約 ${escapeHtml(String(r.score))}/495`)
        .join("；")}</div>`;
    }
    el.innerHTML = html;
  },

  // ---------- 功能三:弱點分布 ----------
  renderWeakness() {
    const el = this.container.querySelector("#db-weakness");
    const stats = DataStore.getWeaknessStats();
    if (stats.length === 0) {
      el.innerHTML = `<p class="muted">目前沒有錯題紀錄。</p>`;
      return;
    }
    const max = stats[0].count;
    el.innerHTML = `<div class="chart-area">${stats
      .map(
        (s) => `
      <div class="chart-row">
        <span class="chart-row-label">${escapeHtml(s.category)}</span>
        <div class="chart-bar-track"><div class="chart-bar weakness-bar" style="width:${(s.count / max) * 100}%"></div></div>
        <span class="chart-row-value">${s.count} 次</span>
      </div>`
      )
      .join("")}</div>`;
  },

  // ---------- 功能四:AI 週摘要 ----------
  renderCachedSummary() {
    const cached = JSON.parse(localStorage.getItem("tls_weekly_summary") || "null");
    if (cached) {
      this.container.querySelector("#db-summary-result").textContent = `(${cached.date}) ${cached.text}`;
    }
  },
  async generateWeeklySummary() {
    const btn = this.container.querySelector("#db-summary-btn");
    const resultEl = this.container.querySelector("#db-summary-result");
    btn.disabled = true;
    btn.textContent = "產生中…";
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const recentSessions = DataStore.getAll("studySessions").filter((s) => s.date >= weekAgo);
      const recentErrors = DataStore.getAll("errorLog").filter((e) => e.date >= weekAgo);
      const totalMinutes = recentSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
      const weaknessStats = DataStore.getWeaknessStats();

      const resp = await ApiClient.callClaude({
        model: CONFIG.MODELS.HAIKU,
        maxTokens: 500,
        system: "你是英語學習教練,只用繁體中文,語氣溫和務實,不要客套話,直接給重點與建議。",
        messages: [
          {
            role: "user",
            content: `這是我過去7天的讀書資料:\n讀書總時數約 ${Math.round(totalMinutes / 60 * 10) / 10} 小時(${recentSessions.length} 次)\n新增錯題 ${recentErrors.length} 筆\n累積弱點分布(次數由高到低):${weaknessStats.slice(0, 5).map((s) => `${s.category} ${s.count}次`).join("、") || "無"}\n請用3-4句話生成一段白話摘要,指出這週的學習狀況、哪裡進步了或哪裡還需要加強,並給一個具體建議。`
          }
        ]
      });
      const text = ApiClient.extractText(resp);
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem("tls_weekly_summary", JSON.stringify({ date: today, text }));
      resultEl.textContent = `(${today}) ${text}`;
    } catch (err) {
      resultEl.textContent = err.message || "產生失敗,請稍後再試。";
    } finally {
      btn.disabled = false;
      btn.textContent = "產生本週摘要(Haiku 4.5)";
    }
  },

  // ---------- 功能五:讀書時數與一致性 ----------
  renderConsistency() {
    const el = this.container.querySelector("#db-consistency");
    const sessions = DataStore.getAll("studySessions");
    const last14Days = [...Array(14)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().slice(0, 10);
    });

    const byDay = {};
    sessions.forEach((s) => {
      byDay[s.date] = (byDay[s.date] || 0) + s.duration_minutes;
    });

    const fragmentDays = new Set(sessions.filter((s) => s.time_slot_type === "weekday_fragment").map((s) => s.date));
    const eveningDays = new Set(sessions.filter((s) => s.time_slot_type === "weekday_evening").map((s) => s.date));
    const weekendDays = new Set(sessions.filter((s) => s.time_slot_type === "weekend").map((s) => s.date));

    let streak = 0;
    for (let i = last14Days.length - 1; i >= 0; i--) {
      if (byDay[last14Days[i]]) streak++;
      else break;
    }

    const maxMinutes = Math.max(...last14Days.map((d) => byDay[d] || 0), 60);

    el.innerHTML = `
      <div class="stat-row">
        <div class="stat-box"><span class="stat-num">${streak}</span><span class="stat-label">連續學習天數</span></div>
        <div class="stat-box"><span class="stat-num">${fragmentDays.size}</span><span class="stat-label">週間零碎完成天數</span></div>
        <div class="stat-box"><span class="stat-num">${eveningDays.size}</span><span class="stat-label">週間晚上完成天數</span></div>
        <div class="stat-box"><span class="stat-num">${weekendDays.size}</span><span class="stat-label">週末完成天數</span></div>
      </div>
      <div class="chart-area">
        ${last14Days
          .map(
            (d) => `
          <div class="chart-row">
            <span class="chart-row-label">${d.slice(5)}</span>
            <div class="chart-bar-track"><div class="chart-bar hours-bar" style="width:${((byDay[d] || 0) / maxMinutes) * 100}%"></div></div>
            <span class="chart-row-value">${byDay[d] || 0} 分</span>
          </div>`
          )
          .join("")}
      </div>
    `;
  },

  // ---------- 3.9 節:API 預算與每日開銷視覺化 ----------
  async renderBudget() {
    const el = this.container.querySelector("#db-budget");
    if (!DriveSync.signedIn) {
      el.innerHTML = `<p class="muted">請先用 Google 帳號登入,才能讀取這個月的 AI 花費紀錄。</p>`;
      return;
    }
    el.innerHTML = `<p class="muted">讀取中…</p>`;
    const status = await ApiClient.getBudgetStatus();
    if (!status) {
      el.innerHTML = `<p class="muted">無法讀取預算資料,請確認 Cloudflare Worker 設定是否完成(見 docs/DEPLOYMENT.md）。</p>`;
      return;
    }
    DataStore.cacheApiUsageDaily(Object.entries(status.byDay || {}).map(([date, v]) => ({ date, ...v })));

    const tierLabel = { ok: "正常", warn: "已達 USD 10 提醒", alert: "已達 USD 20 警示", hardStop: "已達 USD 30 上限" }[status.tier];
    const days = Object.keys(status.byDay || {}).sort();
    const maxCost = Math.max(...days.map((d) => status.byDay[d].cost), 1);

    el.innerHTML = `
      <div class="stat-row">
        <div class="stat-box"><span class="stat-num">$${status.totalCost.toFixed(2)}</span><span class="stat-label">本月累計(USD）</span></div>
        <div class="stat-box"><span class="stat-num">${tierLabel}</span><span class="stat-label">目前門檻狀態</span></div>
      </div>
      <div class="chart-area">
        ${days
          .map((d) => {
            const day = status.byDay[d];
            const sonnetCost = (day.byModel[CONFIG.MODELS.SONNET] || {}).cost || 0;
            const haikuCost = (day.byModel[CONFIG.MODELS.HAIKU] || {}).cost || 0;
            const sonnetPct = (sonnetCost / maxCost) * 100;
            const haikuPct = (haikuCost / maxCost) * 100;
            return `
            <div class="chart-row">
              <span class="chart-row-label">${d.slice(5)}</span>
              <div class="chart-bar-track">
                <div class="chart-bar" style="width:${sonnetPct}%;background:#3457d5;display:inline-block;"></div><div class="chart-bar" style="width:${haikuPct}%;background:#f5a623;display:inline-block;"></div>
              </div>
              <span class="chart-row-value">$${day.cost.toFixed(3)}</span>
            </div>`;
          })
          .join("")}
      </div>
      <p class="muted">藍色 = Sonnet 5,橘色 = Haiku 4.5。門檻:USD 10 提醒 / 20 警示 / 30 硬上限。</p>
      ${status.tier === "hardStop" && !status.override ? `<button class="btn-secondary" id="db-override-btn">本月急用,手動解除上限</button>` : ""}
    `;
    const overrideBtn = el.querySelector("#db-override-btn");
    if (overrideBtn) {
      overrideBtn.addEventListener("click", async () => {
        await ApiClient.overrideBudget();
        this.renderBudget();
      });
    }
  }
};

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
function expectedRatioScore(dateStr, startDate, examDate, baseline, target) {
  const ratio = clamp01((new Date(dateStr) - startDate) / (examDate - startDate));
  return baseline + (target - baseline) * ratio;
}
