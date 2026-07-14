/**
 * 語塊生成與複習卡片(需求文件 3.11 節,功能三/四)
 *
 * 功能三:核心字加入時,呼叫 Haiku 4.5 生成語塊卡片內容(搭配詞、可替換修飾語填空、核心意象)。
 * 功能四:語塊複習卡片格式,沿用 js/fsrs.js,與單字卡在同一佇列混合(見 vocab-review.js)。
 *
 * ⚠️ 3.11 已知限制:AI 只能給「常見/較不常見」的相對判斷,不能編造 COCA 等精確頻率數字。
 * 下面的 system prompt 明確禁止 AI 給出任何頻率倍數或語料庫統計數字。
 */

const Chunks = {
  async generateForWord(word, sentence) {
    const resp = await ApiClient.callClaude({
      model: CONFIG.MODELS.HAIKU,
      maxTokens: 500,
      system:
        "你是英語語塊(collocation/chunk)教學助理。說明用繁體中文,英文語塊用英文。" +
        "嚴禁編造任何頻率數字、倍數或語料庫統計(例如不可說「在 COCA 出現 3000 次」或「比 X 常見 5 倍」);" +
        "只能用「常見/較不常見」這類相對描述,不確定就不要硬給。只輸出 JSON,不要任何多餘文字。",
      messages: [
        {
          role: "user",
          content:
            `目標核心字:「${word}」。情境句:「${sentence || "(無)"}」。\n` +
            "請產生這個字的語塊學習卡,只輸出 JSON,格式如下:\n" +
            '{"pattern":"一個含底線空格的常見搭配語塊,例如 make a ___ decision",' +
            '"variants":["可填入空格的常見替換詞,3 個"],' +
            '"collocations":["1-2 組最常見的搭配"],' +
            '"core_image":"若為多義字,用一句繁體中文說明核心意象;若不是多義字回空字串"}'
        }
      ]
    });
    return this._parseJson(ApiClient.extractText(resp));
  },

  _parseJson(text) {
    const m = text && text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch (e) {
      return null;
    }
  },

  toChunkItem(word, sentence, data) {
    if (!data) return null;
    const chunkText = data.pattern || (Array.isArray(data.collocations) && data.collocations[0]) || word;
    const variants = Array.isArray(data.variants) ? data.variants : [];
    // 把 collocations 也一併存進 common_variants 後段,複習卡背面可一起顯示
    const collos = Array.isArray(data.collocations) ? data.collocations : [];
    return {
      chunk_text: chunkText,
      chunk_type: "collocation",
      core_word: word,
      common_variants: variants.concat(collos.filter((c) => !variants.includes(c))),
      core_image_note: data.core_image || null,
      source_sentence: sentence || "",
      vocab_tier: "core_3000"
    };
  },

  /**
   * 語塊複習卡片的正面(挖空)與背面 HTML 片段,供 vocab-review.js 混合渲染。
   * 正面:語塊填空(把底線保留;若無底線,改挖掉 core_word)。
   */
  reviewFront(item) {
    let front = item.chunk_text || "";
    if (!/_/.test(front) && item.core_word) {
      front = front.replace(new RegExp(chunkEscapeRegExp(item.core_word), "gi"), "____");
    }
    return escapeHtml(front);
  },

  reviewBack(item) {
    const variants = (item.common_variants || []).map((v) => escapeHtml(v)).join("、");
    return `
      <p class="rc-word">${escapeHtml(item.chunk_text)}</p>
      ${variants ? `<p class="rc-meaning">常見替換/搭配:${variants}</p>` : ""}
      ${item.core_image_note ? `<p class="muted">核心意象:${escapeHtml(item.core_image_note)}</p>` : ""}
      ${item.source_sentence ? `<p class="muted">情境:${escapeHtml(item.source_sentence)}</p>` : ""}
    `;
  }
};

function chunkEscapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
