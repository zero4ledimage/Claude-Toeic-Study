/**
 * App 進入點:分頁切換、Google 登入狀態、部署設定檢查
 */

const TABS = [
  { id: "dashboard", mount: (el) => Dashboard.mount(el) },
  { id: "practice", mount: (el) => Practice.mount(el) },
  { id: "vocab", mount: (el) => VocabReview.mount(el) },
  { id: "decomposer", mount: (el) => Decomposer.mount(el) },
  { id: "video-import", mount: (el) => VideoImport.mount(el) },
  { id: "error-log", mount: (el) => ErrorLog.mount(el) },
  { id: "writing", mount: (el) => WritingSandbox.mount(el) },
  { id: "speaking", mount: (el) => SpeakingModule.mount(el) },
  { id: "mock-schedule", mount: (el) => MockSchedule.mount(el) }
];

function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tabId));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + tabId));
  const tab = TABS.find((t) => t.id === tabId);
  const container = document.getElementById("view-" + tabId);
  if (tab) tab.mount(container);
}

function isConfigured() {
  return !CONFIG.WORKER_URL.includes("REPLACE_WITH") && !CONFIG.GOOGLE_CLIENT_ID.includes("REPLACE_WITH");
}

function renderAuthArea() {
  const el = document.getElementById("auth-area");
  if (!isConfigured()) {
    el.innerHTML = `<span class="muted">尚未完成部署設定</span>`;
    return;
  }
  if (DriveSync.signedIn) {
    el.innerHTML = `<span class="auth-status">已登入 Google,資料同步中</span> <button class="btn-secondary" id="signout-btn">登出</button>`;
    el.querySelector("#signout-btn").addEventListener("click", () => {
      DriveSync.signOut();
      renderAuthArea();
    });
  } else {
    el.innerHTML = `<button class="btn-primary" id="signin-btn">用 Google 帳號登入</button>`;
    el.querySelector("#signin-btn").addEventListener("click", async () => {
      const btn = el.querySelector("#signin-btn");
      btn.disabled = true;
      btn.textContent = "登入中…";
      try {
        await DriveSync.signIn();
        renderAuthArea();
        // 重新載入目前分頁,讓 Drive 拉回的資料反映到畫面上
        const activeTab = document.querySelector(".tab-btn.active");
        if (activeTab) switchTab(activeTab.dataset.tab);
      } catch (e) {
        console.error(e);
        btn.disabled = false;
        btn.textContent = "用 Google 帳號登入";
        alert("登入失敗,請確認 docs/DEPLOYMENT.md Part 2 的 Google Cloud 設定是否正確。");
      }
    });
  }
}

function renderSetupWarning() {
  const el = document.getElementById("setup-warning");
  if (isConfigured()) {
    el.style.display = "none";
    return;
  }
  el.style.display = "block";
  el.innerHTML = `⚠️ 尚未完成部署設定:請依 <a href="docs/DEPLOYMENT.md">docs/DEPLOYMENT.md</a> 完成 Cloudflare Worker 與 Google Cloud Console 設定,並把網址/Client ID 填入 js/config.js,否則登入與 AI 功能無法使用(單字互動查詢與離線瀏覽不受影響)。`;
}

window.addEventListener("DOMContentLoaded", async () => {
  renderSetupWarning();
  renderAuthArea();

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  document.addEventListener("tls:navigate", (e) => switchTab(e.detail.tab));

  Scheduler.mount(document.getElementById("scheduler-banner-container"));
  switchTab("dashboard");

  if (isConfigured()) {
    await DriveSync.init();
  }
});
