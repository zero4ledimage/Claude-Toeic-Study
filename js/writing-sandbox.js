/**
 * 寫作批改沙盒 — 輕量版(需求文件 3.3 節,Phase 1 先求可用,Phase 2 才分流強化)
 *
 * 輸入一段寫作,AI 輸出:1) 修正版(文法用詞錯誤+說明原因) 2) 升級版(改寫為目標
 * 分數對應水準的進階句型與詞彙)。Task 1/Task 2 分流的精細 prompt 留到 Phase 2,
 * 這裡先用同一套邏輯依「情境類型」調整 system prompt 的評分重點提示。
 */

const WRITING_MODES = {
  toeic_email: { label: "多益商務書信", hint: "例如回覆客戶、內部通知等商務情境書信。", focus: "多益商務書信的清晰度、正式用語與格式" },
  ielts_task1: { label: "雅思 Task 1(圖表描述）", hint: "描述圖表、流程圖或地圖等視覺資料。", focus: "資料描述的準確度、關鍵趨勢的掌握與資料型寫作慣用句型" },
  ielts_task2: { label: "雅思 Task 2(議論文）", hint: "針對一個議題提出立場並論證。", focus: "論證邏輯的完整度、立場一致性與段落結構" },
  journal: { label: "自由寫作/日記", hint: "每日 15-20 分鐘維持手感用,主題不拘。", focus: "自然流暢度與詞彙多樣性,語氣可以輕鬆一點" }
};

const WritingSandbox = {
  mount(container) {
    this.container = container;
    this.render();
  },

  render() {
    this.container.innerHTML = `
      <div class="card">
        <h2>寫作批改沙盒</h2>
        <p class="muted">此功能使用 Claude Sonnet 5,會計入 AI 預算。Phase 1 先提供修正版+升級版兩段回饋,Task 1/Task 2 更細緻的分流評分邏輯留到 Phase 2 強化。</p>
        <label class="field-label">情境類型</label>
        <select id="ws-mode">
          ${Object.entries(WRITING_MODES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("")}
        </select>
        <p class="muted" id="ws-hint"></p>
        <label class="field-label">你的寫作內容</label>
        <textarea id="ws-input" rows="8" placeholder="在這裡寫下你的段落…"></textarea>
        <button class="btn-primary" id="ws-submit-btn">送出批改</button>
        <div id="ws-status"></div>
      </div>
      <div id="ws-result"></div>
    `;
    const modeSelect = this.container.querySelector("#ws-mode");
    const updateHint = () => {
      this.container.querySelector("#ws-hint").textContent = WRITING_MODES[modeSelect.value].hint;
    };
    modeSelect.addEventListener("change", updateHint);
    updateHint();

    this.container.querySelector("#ws-submit-btn").addEventListener("click", () => this.submit());
  },

  async submit() {
    const text = this.container.querySelector("#ws-input").value.trim();
    const modeKey = this.container.querySelector("#ws-mode").value;
    const mode = WRITING_MODES[modeKey];
    const statusEl = this.container.querySelector("#ws-status");
    const btn = this.container.querySelector("#ws-submit-btn");
    if (!text) {
      statusEl.textContent = "請先輸入寫作內容。";
      return;
    }
    btn.disabled = true;
    statusEl.textContent = "批改中,請稍候…";

    try {
      const resp = await ApiClient.callClaude({
        model: CONFIG.MODELS.SONNET,
        maxTokens: 1500,
        system:
          `你是專業英語寫作教師,協助多益750分/雅思7.5分程度的考生批改「${mode.label}」類型的寫作,評分重點是${mode.focus}。` +
          "請用繁體中文回覆,依序輸出兩個段落,分別以「【修正版】」與「【升級版】」開頭:" +
          "【修正版】保留原意,只修正文法與用詞錯誤,並在後面用括號簡短說明修正原因;" +
          "【升級版】改寫成更接近目標分數水準的進階句型與詞彙,同樣保留原意。",
        messages: [{ role: "user", content: text }]
      });
      const feedback = ApiClient.extractText(resp);
      this.container.querySelector("#ws-result").innerHTML = `
        <div class="card">
          <h3>批改結果</h3>
          <div class="ws-feedback">${escapeHtml(feedback).replace(/\n/g, "<br>")}</div>
        </div>
      `;
      statusEl.textContent = "";
    } catch (err) {
      statusEl.textContent = err.message || "批改失敗,請稍後再試。";
    } finally {
      btn.disabled = false;
    }
  }
};
