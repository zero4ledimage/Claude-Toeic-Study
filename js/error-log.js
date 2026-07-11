/**
 * 錯題本 / Error Log(需求文件 3.5 節)
 *
 * 官方題庫與免費線上模考都無法自動化匯入(見 2.3 節版權查證),所以這裡主要是
 * 「手動記錄」介面:你在紙本題本或免費模考網站上作答後,把錯的題目謄寫進來。
 * FSRS 複習答錯(js/fsrs.js 的 Again 評分)則會自動累加對應單字的 error_count,
 * 不需要另外手動登記。
 *
 * 每筆錯題可選擇呼叫 Claude Haiku 4.5(依 4.4 節,大量練習題生成屬於高頻低成本
 * 任務)生成幾題同類型的原創練習題,作為「延伸練習」(3.5 節)。
 */

const ErrorLog = {
  mount(container) {
    this.container = container;
    this.render();
  },

  render() {
    const entries = DataStore.getAll("errorLog").slice().reverse();
    this.container.innerHTML = `
      <div class="card">
        <h2>新增錯題</h2>
        <p class="muted">官方題庫/免費模考網站的作答結果無法自動匯入(版權限制),請在這裡手動記錄錯題,累積成你自己的弱點資料庫。</p>
        <label class="field-label">技能</label>
        <select id="el-skill">
          <option value="reading">閱讀</option>
          <option value="listening">聽力</option>
          <option value="writing">寫作</option>
          <option value="speaking">口說</option>
        </select>
        <label class="field-label">錯誤類型</label>
        <select id="el-category">
          <option value="vocab">單字</option>
          <option value="grammar">文法點</option>
          <option value="logic">邏輯理解</option>
        </select>
        <label class="field-label">題目/原文內容</label>
        <textarea id="el-original" rows="3" placeholder="題目內容、你選的答案、或當時看不懂的句子…"></textarea>
        <label class="field-label">正確答案/解析</label>
        <textarea id="el-correction" rows="3" placeholder="正確答案是什麼、為什麼…"></textarea>
        <button class="btn-primary" id="el-add-btn">加入錯題本</button>
      </div>
      <div class="card">
        <h2>錯題本(${entries.length})</h2>
        <div id="el-list"></div>
      </div>
    `;

    this.container.querySelector("#el-add-btn").addEventListener("click", () => {
      const skill_type = this.container.querySelector("#el-skill").value;
      const error_category = this.container.querySelector("#el-category").value;
      const original_content = this.container.querySelector("#el-original").value.trim();
      const correction = this.container.querySelector("#el-correction").value.trim();
      if (!original_content) return;
      DataStore.addErrorLogEntry({ skill_type, error_category, original_content, correction, related_vocab_ids: [] });
      this.render();
    });

    const listEl = this.container.querySelector("#el-list");
    if (entries.length === 0) {
      listEl.innerHTML = `<p class="muted">目前沒有錯題紀錄。</p>`;
    } else {
      entries.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "review-item";
        row.innerHTML = `
          <p class="review-meta">${escapeHtml(entry.date)} · ${escapeHtml(this._skillLabel(entry.skill_type))} · ${escapeHtml(this._categoryLabel(entry.error_category))}</p>
          <p class="review-q">${escapeHtml(entry.original_content)}</p>
          ${entry.correction ? `<p class="review-correct">${escapeHtml(entry.correction)}</p>` : ""}
          <div class="el-actions">
            <button class="btn-secondary el-ai-btn">AI 出相似練習題</button>
            <button class="btn-secondary el-delete-btn">刪除</button>
          </div>
          <div class="el-ai-result" style="display:none;"></div>
        `;
        row.querySelector(".el-delete-btn").addEventListener("click", () => {
          DataStore.removeErrorLogEntry(entry.id);
          this.render();
        });
        row.querySelector(".el-ai-btn").addEventListener("click", (e) => this._generatePractice(entry, e.target));
        listEl.appendChild(row);
      });
    }
  },

  async _generatePractice(entry, btn) {
    btn.disabled = true;
    btn.textContent = "產生中…";
    const resultEl = btn.closest(".review-item").querySelector(".el-ai-result");
    try {
      const resp = await ApiClient.callClaude({
        model: CONFIG.MODELS.HAIKU,
        maxTokens: 600,
        system: "你是多益/雅思英語教學助理,只用繁體中文回答。",
        messages: [
          {
            role: "user",
            content: `我在「${this._skillLabel(entry.skill_type)}」這項技能上,因為「${this._categoryLabel(entry.error_category)}」問題答錯了以下題目:\n${entry.original_content}\n正確答案/解析:${entry.correction || "(未提供)"}\n請針對同一個知識點,原創出 3 題類似難度的新題目(附選項與正確答案),幫助我加強這個弱點。`
          }
        ]
      });
      resultEl.textContent = ApiClient.extractText(resp);
      resultEl.style.display = "block";
      btn.textContent = "已產生";
    } catch (err) {
      resultEl.textContent = err.message || "產生失敗,請稍後再試。";
      resultEl.style.display = "block";
      btn.textContent = "AI 出相似練習題";
      btn.disabled = false;
    }
  },

  _skillLabel(v) {
    return { reading: "閱讀", listening: "聽力", writing: "寫作", speaking: "口說" }[v] || v;
  },
  _categoryLabel(v) {
    return { vocab: "單字", grammar: "文法點", logic: "邏輯理解" }[v] || v;
  }
};
