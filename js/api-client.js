/**
 * Cloudflare Worker 呼叫封裝(所有 Claude API 呼叫都經過這裡,見 worker/src/index.js)
 */

const ApiClient = {
  async callClaude({ model, system, messages, maxTokens = 1024 }) {
    if (!DriveSync.signedIn) {
      const err = new Error("請先用 Google 帳號登入才能使用 AI 功能。");
      err.needsSignIn = true;
      throw err;
    }
    const resp = await fetch(CONFIG.WORKER_URL + "/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DriveSync.accessToken}`
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages })
    });
    const data = await resp.json();
    if (!resp.ok) {
      const err = new Error(data.message || data.error || "AI 呼叫失敗");
      err.budgetExceeded = data.error === "budget_exceeded";
      err.raw = data;
      throw err;
    }
    return data;
  },

  extractText(claudeResponse) {
    if (!claudeResponse || !claudeResponse.content) return "";
    return claudeResponse.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  },

  async getBudgetStatus() {
    if (!DriveSync.signedIn) return null;
    const resp = await fetch(CONFIG.WORKER_URL + "/budget/status", {
      headers: { Authorization: `Bearer ${DriveSync.accessToken}` }
    });
    if (!resp.ok) return null;
    return resp.json();
  },

  async overrideBudget() {
    const resp = await fetch(CONFIG.WORKER_URL + "/budget/override", {
      method: "POST",
      headers: { Authorization: `Bearer ${DriveSync.accessToken}` }
    });
    return resp.json();
  }
};
