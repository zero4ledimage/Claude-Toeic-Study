/**
 * 單字互動查詢與重點單字清單(需求文件 3.7 節,功能一、二)
 *
 * - wrapInteractiveText():把一段文字轉成每個單字獨立 <span> 的 HTML,供閱讀/聽力
 *   逐字稿頁面使用
 * - 滑鼠停留 0.3 秒後彈出提示框(桌面),或點一下切換顯示(觸控裝置)
 * - 查詢資料完全來自本地 data/dictionary/dict-subset.json,不呼叫 API
 * - 提示框內「＋加入單字清單」寫入 DataStore.vocabItems,次日起自動進入 FSRS 佇列
 * - 選用的「AI 情境用法說明」則會呼叫 Worker(Haiku 4.5),屬於低頻率動作,需登入
 */

const VocabLookup = {
  dict: null,
  dictLoadingPromise: null,
  tooltipEl: null,
  hoverTimer: null,
  isTouchDevice: "ontouchstart" in window || navigator.maxTouchPoints > 0,

  async loadDictionary() {
    if (this.dict) return this.dict;
    if (this.dictLoadingPromise) return this.dictLoadingPromise;
    this.dictLoadingPromise = fetch("data/dictionary/dict-subset.json")
      .then((r) => r.json())
      .then((data) => {
        this.dict = data;
        return data;
      })
      .catch((e) => {
        console.error("字典載入失敗", e);
        this.dict = {};
        return this.dict;
      });
    return this.dictLoadingPromise;
  },

  lookup(word) {
    if (!this.dict) return null;
    const clean = word.toLowerCase().replace(/[^a-z']/g, "");
    return this.dict[clean] || null;
  },

  /**
   * 把一段純文字轉換成互動式 HTML:每個英文單字包成 <span class="lookup-word">,
   * 並標記該單字所屬的完整句子(供加入單字清單時擷取情境句)。
   */
  wrapInteractiveText(text) {
    // escapeHtml 已把 " ' < > & 都轉義,放進 HTML 屬性值也安全
    const escapeAttr = (s) => escapeHtml(s);

    const sentences = text.match(/[^.!?\n]+[.!?]*|\n+/g) || [text];
    const wordRegex = /[A-Za-z]+(?:'[A-Za-z]+)?/g;

    return sentences
      .map((sentence) => {
        if (/^\n+$/.test(sentence)) return "<br>";
        const trimmed = sentence.trim();
        return escapeHtml(sentence).replace(wordRegex, (match) => {
          return `<span class="lookup-word" data-word="${match.toLowerCase()}" data-sentence="${escapeAttr(trimmed)}">${match}</span>`;
        });
      })
      .join("");
  },

  /**
   * 讓一個容器內所有 .lookup-word 具備互動查詢功能(事件委派,容器內容可動態變化)
   */
  attach(container) {
    this.loadDictionary();
    this._ensureTooltip();
    this._ensureChunkAction();

    // 功能二(3.11):選取片語/短句 → 加入語塊清單。桌面 mouseup、觸控 touchend 後檢查選取範圍。
    const onSelect = () => setTimeout(() => this._maybeShowChunkAction(container), 10);
    container.addEventListener("mouseup", onSelect);
    container.addEventListener("touchend", onSelect);

    if (this.isTouchDevice) {
      container.addEventListener("click", (e) => {
        const span = e.target.closest(".lookup-word");
        if (span && container.contains(span)) {
          e.stopPropagation();
          this._toggleTooltip(span);
        } else {
          this._hideTooltip();
        }
      });
    } else {
      container.addEventListener(
        "mouseenter",
        (e) => {
          const span = e.target.closest && e.target.closest(".lookup-word");
          if (!span || !container.contains(span)) return;
          clearTimeout(this.hoverTimer);
          this.hoverTimer = setTimeout(() => this._showTooltip(span), 300);
        },
        true
      );
      container.addEventListener(
        "mouseleave",
        (e) => {
          const span = e.target.closest && e.target.closest(".lookup-word");
          if (!span) return;
          clearTimeout(this.hoverTimer);
        },
        true
      );
    }
  },

  _ensureTooltip() {
    if (this.tooltipEl) return;
    const el = document.createElement("div");
    el.className = "vocab-tooltip";
    el.style.display = "none";
    document.body.appendChild(el);
    this.tooltipEl = el;
    document.addEventListener("click", (e) => {
      if (this.isTouchDevice && !e.target.closest(".vocab-tooltip") && !e.target.closest(".lookup-word")) {
        this._hideTooltip();
      }
    });
  },

  _toggleTooltip(span) {
    if (this.tooltipEl.style.display !== "none" && this.tooltipEl._currentSpan === span) {
      this._hideTooltip();
    } else {
      this._showTooltip(span);
    }
  },

  _showTooltip(span) {
    const word = span.dataset.word;
    const sentence = span.dataset.sentence;
    const entry = this.lookup(word);
    const tip = this.tooltipEl;
    tip._currentSpan = span;

    const kk = entry ? entry.kk : "";
    const meaning = entry ? entry.meaning : "(字典中查無此字,可能是專有名詞或字典子集未收錄)";

    tip.innerHTML = `
      <div class="vt-word">${escapeHtml(entry ? entry.word : word)}</div>
      ${kk ? `<div class="vt-kk">[${escapeHtml(kk)}]</div>` : ""}
      <div class="vt-meaning">${escapeHtml(meaning)}</div>
      <div class="vt-actions">
        <button class="vt-add-btn">＋加入單字清單</button>
        <button class="vt-ai-btn">AI 情境用法說明</button>
        ${WordTier.isCore(entry ? entry.word : word) ? `<button class="vt-chunk-btn">＋生成語塊卡片(核心字)</button>` : ""}
      </div>
      <div class="vt-ai-result" style="display:none;"></div>
    `;
    tip.style.display = "block";

    const rect = span.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 6;
    let left = rect.left + window.scrollX;
    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
    // 避免超出視窗右側
    requestAnimationFrame(() => {
      const tipRect = tip.getBoundingClientRect();
      if (tipRect.right > window.innerWidth) {
        tip.style.left = `${Math.max(8, window.innerWidth - tipRect.width - 8)}px`;
      }
    });

    tip.querySelector(".vt-add-btn").addEventListener("click", () => {
      DataStore.addVocabItem({
        word: entry ? entry.word : word,
        phonetic: kk,
        definition: meaning,
        source_sentence: sentence,
        source_type: span.dataset.sourceType || "manual"
      });
      tip.querySelector(".vt-add-btn").textContent = "已加入 ✓";
      tip.querySelector(".vt-add-btn").disabled = true;
    });

    const chunkBtn = tip.querySelector(".vt-chunk-btn");
    if (chunkBtn) {
      chunkBtn.addEventListener("click", async () => {
        chunkBtn.disabled = true;
        chunkBtn.textContent = "生成中…";
        const resultEl = tip.querySelector(".vt-ai-result");
        try {
          const data = await Chunks.generateForWord(entry ? entry.word : word, sentence);
          const chunkFields = Chunks.toChunkItem(entry ? entry.word : word, sentence, data);
          if (!chunkFields) throw new Error("AI 回傳格式無法解析,請再試一次。");
          DataStore.addChunkItem(chunkFields);
          resultEl.innerHTML = `已加入語塊卡:<strong>${escapeHtml(chunkFields.chunk_text)}</strong>,明天起會進入複習佇列。`;
          resultEl.style.display = "block";
          chunkBtn.textContent = "已生成 ✓";
        } catch (err) {
          resultEl.textContent = err.needsSignIn ? "登入 Google 帳號後才能生成語塊卡片。" : (err.message || "生成失敗,請稍後再試。");
          resultEl.style.display = "block";
          chunkBtn.disabled = false;
          chunkBtn.textContent = "＋生成語塊卡片(核心字)";
        }
      });
    }

    tip.querySelector(".vt-ai-btn").addEventListener("click", async (e) => {
      const btn = e.target;
      btn.disabled = true;
      btn.textContent = "查詢中…";
      const resultEl = tip.querySelector(".vt-ai-result");
      try {
        const resp = await ApiClient.callClaude({
          model: CONFIG.MODELS.HAIKU,
          maxTokens: 300,
          system: "你是英語教學助理,只用繁體中文簡潔回答,不要客套話。",
          messages: [
            {
              role: "user",
              content: `這是一句英文:「${sentence}」。請針對其中的單字「${word}」,用1-2句繁體中文說明它在這句話裡的精確用法與語氣,適合多益/雅思考生閱讀。`
            }
          ]
        });
        resultEl.textContent = ApiClient.extractText(resp);
        resultEl.style.display = "block";
        btn.textContent = "已查詢";
      } catch (err) {
        resultEl.textContent = err.message || "查詢失敗,請稍後再試。";
        resultEl.style.display = "block";
        btn.textContent = "AI 情境用法說明";
        btn.disabled = false;
      }
    });
  },

  _hideTooltip() {
    if (this.tooltipEl) {
      this.tooltipEl.style.display = "none";
      this.tooltipEl._currentSpan = null;
    }
    clearTimeout(this.hoverTimer);
  },

  // ---------- 功能二(3.11):選取片語/短句加入語塊清單 ----------
  _ensureChunkAction() {
    if (this.chunkActionEl) return;
    const el = document.createElement("div");
    el.className = "vocab-tooltip chunk-action";
    el.style.display = "none";
    document.body.appendChild(el);
    this.chunkActionEl = el;
    document.addEventListener("mousedown", (e) => {
      if (!e.target.closest(".chunk-action")) this._hideChunkAction();
    });
  },

  _hideChunkAction() {
    if (this.chunkActionEl) this.chunkActionEl.style.display = "none";
  },

  _maybeShowChunkAction(container) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { this._hideChunkAction(); return; }
    const text = sel.toString().trim().replace(/\s+/g, " ");
    // 只在「選到多個字」時才出現(單字用滑鼠停留提示框即可)
    if (!text || !text.includes(" ")) { this._hideChunkAction(); return; }
    if (!container.contains(sel.anchorNode)) { this._hideChunkAction(); return; }

    const anchorEl = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
    const lw = anchorEl && anchorEl.closest ? anchorEl.closest(".lookup-word") : null;
    const sentence = (lw && lw.dataset.sentence) || text;
    const firstWord = (text.match(/[A-Za-z']+/) || [""])[0];

    const el = this.chunkActionEl;
    el.innerHTML = `
      <div class="vt-word">${escapeHtml(text)}</div>
      <label class="field-label">類型</label>
      <select class="ca-type">
        <option value="collocation">搭配詞</option>
        <option value="phrasal_verb">片語動詞</option>
        <option value="idiom">慣用語</option>
        <option value="sentence_pattern">句型</option>
      </select>
      <div class="vt-actions"><button class="ca-add-btn">＋加入語塊清單</button></div>
      <div class="ca-result vt-ai-result" style="display:none;"></div>
    `;
    el.style.display = "block";
    try {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      el.style.top = `${rect.bottom + window.scrollY + 6}px`;
      el.style.left = `${Math.max(8, rect.left + window.scrollX)}px`;
    } catch (e) { /* ignore positioning errors */ }

    el.querySelector(".ca-add-btn").addEventListener("click", () => {
      const chunk_type = el.querySelector(".ca-type").value;
      DataStore.addChunkItem({
        chunk_text: text,
        chunk_type,
        core_word: firstWord,
        common_variants: [],
        core_image_note: null,
        source_sentence: sentence,
        vocab_tier: WordTier.classify(firstWord)
      });
      const res = el.querySelector(".ca-result");
      res.textContent = "已加入語塊清單,明天起進入複習佇列。";
      res.style.display = "block";
      el.querySelector(".ca-add-btn").disabled = true;
    });
  }
};
