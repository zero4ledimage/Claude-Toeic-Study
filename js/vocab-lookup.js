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
    const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const escapeAttr = (s) => escapeHtml(s).replace(/"/g, "&quot;");

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
      <div class="vt-word">${entry ? entry.word : word}</div>
      ${kk ? `<div class="vt-kk">[${kk}]</div>` : ""}
      <div class="vt-meaning">${meaning}</div>
      <div class="vt-actions">
        <button class="vt-add-btn">＋加入單字清單</button>
        <button class="vt-ai-btn">AI 情境用法說明</button>
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
  }
};
