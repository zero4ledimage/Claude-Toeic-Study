/**
 * 多益模擬考排程(需求文件 2.4 節、3.6 節)
 *
 * 官方題庫有版權,無法在工具裡直接出題(見 2.3 節),這裡的定位是「提醒 +
 * 記錄」:每 2-4 週提醒你安排一次官方真題模擬考,結果記錄到 progress_records
 * (在儀表板頁面登記,這裡提供捷徑）。
 */

const MockSchedule = {
  mount(container) {
    this.container = container;
    this.render();
  },

  render() {
    const intervalWeeks = Number(localStorage.getItem("tls_mock_interval_weeks") || 3);
    const lastMockDate = this.getLastMockDate();
    const today = new Date();

    let statusHtml;
    if (lastMockDate) {
      const daysSince = Math.floor((today - lastMockDate) / (1000 * 60 * 60 * 24));
      const daysUntilNext = intervalWeeks * 7 - daysSince;
      const overdue = daysUntilNext <= 0;
      statusHtml = `
        <div class="mock-status ${overdue ? "mock-overdue" : ""}">
          <p>上次模考:${lastMockDate.toISOString().slice(0, 10)}(${daysSince} 天前）</p>
          <p>${overdue ? `已經超過建議間隔,該安排下一次模考了!` : `距離建議下次模考還有 ${daysUntilNext} 天`}</p>
        </div>
      `;
    } else {
      statusHtml = `<div class="mock-status mock-overdue"><p>目前沒有模考紀錄,建議這週就安排第一次官方真題模擬考。</p></div>`;
    }

    statusHtml += this.renderPurchaseReminder(today);

    this.container.innerHTML = `
      <div class="card">
        <h2>多益模擬考排程</h2>
        <p class="muted">建議每 2-4 週做一次完整的官方真題模擬考(見需求文件 2.2 節建議來源),用來校準真實分數與弱點,免費線上模考網站的結果無法自動匯入,答錯的題目請到「錯題本」手動記錄。</p>
        ${statusHtml}
        <label class="field-label">模考間隔(週）</label>
        <select id="ms-interval">
          <option value="2">2 週</option>
          <option value="3" selected>3 週</option>
          <option value="4">4 週</option>
        </select>
        <button class="btn-primary" id="ms-mark-btn">登記「今天做了模考」</button>
        <button class="btn-secondary" id="ms-goto-dashboard-btn">前往儀表板登記分數</button>
      </div>
    `;

    const intervalSelect = this.container.querySelector("#ms-interval");
    intervalSelect.value = String(intervalWeeks);
    intervalSelect.addEventListener("change", () => {
      localStorage.setItem("tls_mock_interval_weeks", intervalSelect.value);
      this.render();
    });

    this.container.querySelector("#ms-mark-btn").addEventListener("click", () => {
      localStorage.setItem("tls_last_mock_marked", new Date().toISOString());
      this.render();
    });
    this.container.querySelector("#ms-goto-dashboard-btn").addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("tls:navigate", { detail: { tab: "dashboard" } }));
    });
  },

  getLastMockDate() {
    const records = DataStore.getAll("progressRecords")
      .filter((r) => r.source === "official_mock")
      .map((r) => new Date(r.date));
    const marked = localStorage.getItem("tls_last_mock_marked");
    if (marked) records.push(new Date(marked));
    if (records.length === 0) return null;
    return new Date(Math.max(...records.map((d) => d.getTime())));
  },

  renderPurchaseReminder(today) {
    const toeicWindow = today < new Date("2026-08-31");
    const ieltsWindowStart = new Date("2026-11-01");
    const ieltsWindowEnd = new Date("2026-12-31");
    const inIeltsWindow = today >= ieltsWindowStart && today <= ieltsWindowEnd;
    let notes = [];
    if (toeicWindow) notes.push("多益官方全真模擬試題現在就可以購入(見需求文件 2.2 節),搭配這裡的排程開始使用。");
    if (inIeltsWindow) notes.push("現在是建議採購劍橋雅思真題的時間窗(2026年11-12月),可以開始留意最新一冊。");
    if (notes.length === 0) return "";
    return `<div class="mock-purchase-note muted">${notes.join("<br>")}</div>`;
  }
};
