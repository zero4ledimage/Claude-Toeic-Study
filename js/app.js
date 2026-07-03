// 分頁切換與初始化

const TABS = [
  { id: "dashboard", label: "儀表板", mount: (el) => Dashboard.mount(el) },
  { id: "vocab", label: "每日單字", mount: (el) => VocabQuiz.mount(el) },
  { id: "mock", label: "模考", mount: (el) => MockTest.mount(el) },
  { id: "review", label: "錯題本", mount: (el) => Review.mount(el) }
];

function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tabId));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + tabId));
  const tab = TABS.find((t) => t.id === tabId);
  const container = document.getElementById("view-" + tabId);
  tab.mount(container);
}

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  switchTab("dashboard");
});
