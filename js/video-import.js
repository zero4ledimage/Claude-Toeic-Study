/**
 * 影片逐字稿匯入學習與出題(需求文件 3.12)
 *
 * 使用者把(通常先經 NotebookLM 整理過的)YouTube 訪談/演講逐字稿,連同來源標題貼進來:
 *  - 逐字稿原文存進私有 Google Drive(source_texts)
 *  - 抽出單字/語塊 → FSRS 複習(Haiku)
 *  - 出理解題(Sonnet)、單字情境題與克漏字(Haiku)→ 生成題庫
 * 全部依「來源標題」標記,可就單一來源複習/做題。純文本,不播放影片、不抓取 YouTube。
 */

const VideoImport = {
  mount(container) {
    this.container = container;
    this.render();
  },

  render() {
    this.container.innerHTML = `
      <div class="card">
        <h2>影片逐字稿匯入</h2>
        <p class="muted">把你在 YouTube 看的英文訪談/演講逐字稿(建議先用 NotebookLM 整理)貼進來,系統會抽單字語塊、並用 AI 出理解題/單字題/克漏字,全部依來源分類。內容只存進你自己的 Google Drive。需登入,會計入 AI 預算(單篇約數美分)。</p>
        <label class="field-label">來源標題(影片名)</label>
        <input type="text" id="vi-title" placeholder="例如:Steve Jobs Stanford Commencement Speech">
        <label class="field-label">逐字稿內容</label>
        <textarea id="vi-text" rows="10" placeholder="貼上整理後的逐字稿…"></textarea>
        <button class="btn-primary" id="vi-import-btn">匯入並生成(單字 + 題目)</button>
        <div id="vi-status" class="muted" style="margin-top:0.5rem;white-space:pre-wrap;"></div>
      </div>
      <div class="card">
        <h2>已匯入來源</h2>
        <div id="vi-sources"></div>
      </div>
    `;
    this.container.querySelector("#vi-import-btn").addEventListener("click", () => this._import());
    this._renderSources();
  },

  _renderSources() {
    const el = this.container.querySelector("#vi-sources");
    const sources = DataStore.getSourceTexts().slice().reverse();
    if (sources.length === 0) {
      el.innerHTML = `<p class="muted">尚未匯入任何逐字稿。</p>`;
      return;
    }
    const vocab = DataStore.getAll("vocabItems");
    const chunks = DataStore.getAll("chunkItems");
    el.innerHTML = sources.map((s) => {
      const label = s.source_label;
      const vCount = vocab.filter((v) => v.source_label === label).length + chunks.filter((c) => c.source_label === label).length;
      const gen = DataStore.getGeneratedItems(undefined, label);
      const qCount = gen.reduce((n, g) => n + (g.type === "reading" ? (g.payload.questions || []).length : 1), 0);
      return `
        <div class="review-item" data-id="${s.id}">
          <p class="review-meta">${escapeHtml(s.created_at.slice(0, 10))} · 單字/語塊 ${vCount} · 題目 ${qCount}</p>
          <p class="review-q"><strong>${escapeHtml(label)}</strong></p>
          <div class="el-actions">
            <button class="btn-secondary vi-practice" data-label="${escapeHtml(label)}">用此來源做練習</button>
            <button class="btn-secondary vi-view" data-id="${s.id}">看逐字稿</button>
            <button class="btn-secondary vi-del" data-id="${s.id}">刪除來源</button>
          </div>
          <div class="vi-transcript el-ai-result" style="display:none;"></div>
        </div>`;
    }).join("");

    el.querySelectorAll(".vi-practice").forEach((b) => b.addEventListener("click", () => {
      Practice.pendingSource = b.dataset.label;
      document.dispatchEvent(new CustomEvent("tls:navigate", { detail: { tab: "practice" } }));
    }));
    el.querySelectorAll(".vi-view").forEach((b) => b.addEventListener("click", () => {
      const s = DataStore.getSourceTexts().find((x) => x.id === b.dataset.id);
      const box = b.closest(".review-item").querySelector(".vi-transcript");
      if (box.style.display === "none") { box.textContent = s ? s.text : ""; box.style.display = "block"; }
      else box.style.display = "none";
    }));
    el.querySelectorAll(".vi-del").forEach((b) => b.addEventListener("click", () => {
      if (confirm("刪除這個來源的逐字稿?(已生成的單字與題目會保留)")) {
        DataStore.removeSourceText(b.dataset.id);
        this._renderSources();
      }
    }));
  },

  async _import() {
    const title = this.container.querySelector("#vi-title").value.trim();
    const text = this.container.querySelector("#vi-text").value.trim();
    const statusEl = this.container.querySelector("#vi-status");
    const btn = this.container.querySelector("#vi-import-btn");
    if (!title || !text) { statusEl.textContent = "請填入來源標題並貼上逐字稿。"; return; }
    if (text.length < 100) { statusEl.textContent = "逐字稿內容太短,請貼上較完整的段落。"; return; }

    btn.disabled = true;
    const log = [];
    const setStatus = (line) => { log.push(line); statusEl.textContent = log.join("\n"); };

    // 1) 先把逐字稿原文存進 Drive(離線也會先存 localStorage)
    DataStore.addSourceText({ source_label: title, text });
    setStatus("✓ 逐字稿已儲存");

    try {
      // 2) 抽單字/語塊(Haiku)
      setStatus("· 抽取重點單字/語塊中(Haiku)…");
      const vArr = await this._callArray(CONFIG.MODELS.HAIKU, 1200,
        "你是英語教學助理,從逐字稿挑出對多益/雅思考生有價值的字詞。只輸出 JSON 陣列,不要多餘文字。嚴禁編造頻率數字。",
        `以下英文逐字稿,請挑出 8-12 個有學習價值的單字或搭配詞(避開過於基礎的字),每個附:字詞、KK 音標(盡量)、繁體中文簡短釋義、逐字稿中含它的原句。只輸出 JSON 陣列,元素格式:{"word":"...","kk":"...","meaning":"...","sentence":"原句"}\n\n逐字稿:\n${text}`);
      let vAdded = 0;
      (vArr || []).forEach((v) => {
        if (v && v.word && v.meaning) {
          DataStore.addVocabItem({ word: String(v.word), phonetic: String(v.kk || ""), definition: String(v.meaning), source_sentence: String(v.sentence || ""), source_type: "listening_test", source_label: title });
          vAdded++;
        }
      });
      setStatus(`✓ 單字/語塊已加入 ${vAdded} 個(進 FSRS 複習)`);

      // 3) 理解題(Sonnet)
      setStatus("· 生成理解題中(Sonnet)…");
      const cArr = await this._callArray(CONFIG.MODELS.SONNET, 2000,
        "你是多益 Part 7 出題老師,依提供的文章原創理解題,只輸出 JSON 陣列,不要多餘文字。",
        `根據以下英文內容,出 5 題理解題(主旨或細節),每題 4 個選項。每題附一段從原文擷取、與該題相關的短摘錄(50-90字)當閱讀段落。只輸出 JSON 陣列,元素格式:{"title":"短標題","text":"相關短摘錄","questions":[{"q":"問題","options":["A","B","C","D"],"answer":0到3}]}\n\n內容:\n${text}`);
      let compAdded = 0;
      (cArr || []).forEach((item) => {
        const valid = Practice._validReading(item);
        if (valid) { DataStore.addGeneratedItem({ type: "reading", payload: valid, source_label: title }); compAdded++; }
      });
      setStatus(`✓ 理解題已加入 ${compAdded} 題`);

      // 4) 單字情境題 + 克漏字(Haiku)
      setStatus("· 生成單字情境題與克漏字中(Haiku)…");
      const qObj = await this._callObject(CONFIG.MODELS.HAIKU, 1600,
        "你是多益出題老師,依提供內容原創題目,只輸出 JSON 物件,不要多餘文字。",
        `根據以下英文內容出兩類題,只輸出一個 JSON 物件:\n` +
        `{"vocab_in_context":[{"title":"單字情境","text":"含目標字的原句","questions":[{"q":"In this context, the word \\"X\\" most nearly means:","options":["A","B","C","D"],"answer":0到3}]}],` +
        `"cloze":[{"sentence":"從內容改寫、含一個 ____ 空格的句子","options":["A","B","C","D"],"answer":0到3,"explanation":"繁體中文詳解","category":"generated"}]}\n` +
        `各出 4 題。克漏字務必:填入正解後整句文法正確、無重複字詞。\n\n內容:\n${text}`);
      let vicAdded = 0, clozeAdded = 0;
      if (qObj) {
        (qObj.vocab_in_context || []).forEach((item) => {
          const valid = Practice._validReading(item);
          if (valid) { DataStore.addGeneratedItem({ type: "reading", payload: valid, source_label: title }); vicAdded++; }
        });
        (qObj.cloze || []).forEach((item) => {
          const valid = Practice._validGrammar(item);
          if (valid) { DataStore.addGeneratedItem({ type: "grammar", payload: valid, source_label: title }); clozeAdded++; }
        });
      }
      setStatus(`✓ 單字情境題 ${vicAdded} 題、克漏字 ${clozeAdded} 題已加入\n\n完成!到「測驗練習」即可作答,或用下方「用此來源做練習」。`);
    } catch (err) {
      setStatus(err.needsSignIn ? "⚠️ 登入 Google 帳號後才能用 AI 生成(逐字稿已先存起來)。"
        : err.budgetExceeded ? "⚠️ 本月 AI 預算已達上限,無法生成(逐字稿已存起來)。"
        : "⚠️ 生成過程出錯:" + (err.message || "請稍後再試") + "(逐字稿已存起來)。");
    } finally {
      btn.disabled = false;
      this._renderSources(); // 不論成功或 AI 失敗,都刷新來源列表(逐字稿已存)
    }
  },

  async _callArray(model, maxTokens, system, content) {
    const resp = await ApiClient.callClaude({ model, maxTokens, system, messages: [{ role: "user", content }] });
    return Practice._parseJsonArray(ApiClient.extractText(resp));
  },
  async _callObject(model, maxTokens, system, content) {
    const resp = await ApiClient.callClaude({ model, maxTokens, system, messages: [{ role: "user", content }] });
    const text = ApiClient.extractText(resp);
    const m = text && text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch (e) { return null; }
  }
};
