/**
 * 情境化學習排程建議(需求文件 3.8 節)
 *
 * 依當下是週間白天/週間晚上/週末,主動建議適合的活動類型,並提供手動切換。
 * 透過 dispatch 一個 'tls:navigate' 自訂事件讓 app.js 決定實際跳轉哪個分頁,
 * 避免這個模組直接依賴分頁切換的實作細節。
 */

const SLOT_ACTIVITIES = {
  weekday_fragment: {
    label: "週間白天零碎時段",
    hint: "5-20 分鐘的空檔,適合高頻率、可以隨時中斷的活動。",
    activities: [{ label: "每日練功(做題學習)", tab: "practice" }, { label: "FSRS 到期單字複習", tab: "vocab" }]
  },
  weekday_evening: {
    label: "週間晚上完整時段",
    hint: "0.5-1 小時的完整時間,適合需要專注力的深度練習。",
    activities: [
      { label: "口說寫作維持劑量練習", tab: "speaking" },
      { label: "閱讀/聽力拆解器深度使用", tab: "decomposer" }
    ]
  },
  weekend: {
    label: "週末完整時段",
    hint: "2-3 小時的完整時間,適合模考與弱點回顧。",
    activities: [
      { label: "週末模考(計時估分)", tab: "practice" },
      { label: "官方真題模擬考排程", tab: "mock-schedule" },
      { label: "寫作批改沙盒完整練習", tab: "writing" },
      { label: "口說完整練習", tab: "speaking" },
      { label: "每週弱點回顧", tab: "dashboard" }
    ]
  }
};

const Scheduler = {
  mount(container) {
    this.container = container;
    this.render();
  },

  detectSlot(now = new Date()) {
    const day = now.getDay(); // 0=Sun..6=Sat
    if (day === 0 || day === 6) return "weekend";
    return now.getHours() < 18 ? "weekday_fragment" : "weekday_evening";
  },

  render() {
    const manual = localStorage.getItem("tls_manual_slot") || "";
    const slotKey = manual || this.detectSlot();
    const slot = SLOT_ACTIVITIES[slotKey];

    this.container.innerHTML = `
      <div class="scheduler-banner">
        <div class="sb-main">
          <strong>${slot.label}</strong> — ${slot.hint}
          <div class="sb-activities">
            ${slot.activities
              .map((a) => `<button class="sb-activity-btn" data-tab="${a.tab}">${a.label}</button>`)
              .join("")}
          </div>
        </div>
        <select id="sb-manual-select" class="sb-manual-select">
          <option value="">自動判斷(現在:${slot.label}）</option>
          <option value="weekday_fragment" ${manual === "weekday_fragment" ? "selected" : ""}>手動切換:週間白天零碎</option>
          <option value="weekday_evening" ${manual === "weekday_evening" ? "selected" : ""}>手動切換:週間晚上完整</option>
          <option value="weekend" ${manual === "weekend" ? "selected" : ""}>手動切換:週末完整</option>
        </select>
      </div>
    `;

    this.container.querySelector("#sb-manual-select").addEventListener("change", (e) => {
      if (e.target.value) localStorage.setItem("tls_manual_slot", e.target.value);
      else localStorage.removeItem("tls_manual_slot");
      this.render();
    });

    this.container.querySelectorAll(".sb-activity-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent("tls:navigate", { detail: { tab: btn.dataset.tab } }));
      });
    });
  }
};
