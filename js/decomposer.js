/**
 * 閱讀/聽力素材拆解器(需求文件 3.2 節)
 *
 * 貼上一段閱讀或聽力逐字稿,呼叫 Claude Sonnet 5(依 4.4 節模型分層,拆解屬於
 * 預設模型任務)拆解出「核心單字」「語法結構」「常考考點」,三類都可以一鍵加入
 * FSRS 複習佇列(3.2 節:拆解結果自動進入複習佇列)。
 *
 * 由於 vocab_items 資料表(4.5 節)設計上是「詞彙」導向的欄位(word/definition/
 * source_sentence),這裡把語法結構與常考考點也一併借用同一張表存放,當作廣義
 * 的「可複習卡片」:word 欄位放精簡的語法/考點標籤,definition 放完整說明。
 * source_type 額外擴充了 reading_grammar / reading_testpoint /
 * listening_grammar / listening_testpoint 幾種值來區分類別,這是需求文件
 * 4.5 節本身註明「草案,待細化」下的合理延伸,不是另外新增一張表。
 */

const Decomposer = {
  mount(container) {
    this.container = container;
    this.render();
  },

  render() {
    this.container.innerHTML = `
      <div class="card">
        <h2>閱讀/聽力素材拆解器</h2>
        <p class="muted">貼上一段閱讀文章或聽力逐字稿,AI 會拆解出核心單字、語法結構、常考考點,三類都可以一鍵加入複習清單。此功能使用 Claude Sonnet 5,會計入 AI 預算。</p>
        <label class="field-label">素材類型</label>
        <select id="dc-material-type">
          <option value="reading_test">閱讀</option>
          <option value="listening_test">聽力逐字稿</option>
        </select>
        <label class="field-label">貼上文字</label>
        <textarea id="dc-input" rows="8" placeholder="貼上一段英文閱讀或聽力逐字稿…"></textarea>
        <button class="btn-primary" id="dc-submit-btn">開始拆解</button>
        <div id="dc-status"></div>
      </div>
      <div id="dc-results"></div>
    `;
    this.container.querySelector("#dc-submit-btn").addEventListener("click", () => this.runDecomposition());
  },

  async runDecomposition() {
    const text = this.container.querySelector("#dc-input").value.trim();
    const materialType = this.container.querySelector("#dc-material-type").value;
    const statusEl = this.container.querySelector("#dc-status");
    const btn = this.container.querySelector("#dc-submit-btn");
    if (!text) {
      statusEl.textContent = "請先貼上文字。";
      return;
    }

    btn.disabled = true;
    statusEl.textContent = "拆解中,請稍候…(呼叫 Claude Sonnet 5)";

    try {
      const resp = await ApiClient.callClaude({
        model: CONFIG.MODELS.SONNET,
        maxTokens: 2000,
        system:
          "你是多益/雅思英語教學助理。請分析使用者提供的英文段落,只回傳一個 JSON 物件,不要有任何前後說明文字、不要用 markdown code fence 包起來。" +
          'JSON 格式為:{"vocab":[{"word":"...","meaning":"繁體中文意思"}],"grammar_points":[{"pattern":"語法結構簡述","explanation":"繁體中文解釋,附段落中的例句"}],"test_points":[{"point":"常考考點簡述","explanation":"繁體中文解釋為什麼這是常考點"}]}。' +
          "vocab 挑出對多益/雅思750/7.5分程度考生有幫助、非基礎的字彙,最多12個;grammar_points 最多5個;test_points 最多5個。",
        messages: [{ role: "user", content: text }]
      });

      const raw = ApiClient.extractText(resp).trim();
      const jsonStr = raw.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "");
      const parsed = JSON.parse(jsonStr);
      this.renderResults(text, materialType, parsed);
      statusEl.textContent = "";
    } catch (err) {
      console.error(err);
      statusEl.textContent = err.message || "拆解失敗,請稍後再試。";
    } finally {
      btn.disabled = false;
    }
  },

  renderResults(originalText, materialType, parsed) {
    const resultsEl = this.container.querySelector("#dc-results");
    const vocab = parsed.vocab || [];
    const grammarPoints = parsed.grammar_points || [];
    const testPoints = parsed.test_points || [];

    const findSentence = (needle) => {
      const sentences = originalText.match(/[^.!?\n]+[.!?]*/g) || [originalText];
      const found = sentences.find((s) => s.toLowerCase().includes(needle.toLowerCase()));
      return (found || originalText).trim();
    };

    resultsEl.innerHTML = `
      <div class="card">
        <h3>原文(滑鼠停留或點擊單字可查詢音標/翻譯)</h3>
        <div id="dc-passage" class="passage-text lookup-container"></div>
      </div>
      <div class="card">
        <h3>核心單字(${vocab.length})</h3>
        <div class="extract-list" id="dc-vocab-list"></div>
      </div>
      <div class="card">
        <h3>語法結構(${grammarPoints.length})</h3>
        <div class="extract-list" id="dc-grammar-list"></div>
      </div>
      <div class="card">
        <h3>常考考點(${testPoints.length})</h3>
        <div class="extract-list" id="dc-testpoint-list"></div>
      </div>
    `;

    const passageEl = resultsEl.querySelector("#dc-passage");
    passageEl.innerHTML = VocabLookup.wrapInteractiveText(originalText);
    passageEl.querySelectorAll(".lookup-word").forEach((el) => (el.dataset.sourceType = materialType));
    VocabLookup.attach(passageEl);

    const vocabListEl = resultsEl.querySelector("#dc-vocab-list");
    vocab.forEach((v) => {
      const sentence = findSentence(v.word);
      const row = document.createElement("div");
      row.className = "extract-item";
      row.innerHTML = `<strong>${v.word}</strong> — ${v.meaning} <button class="btn-secondary add-extract-btn">＋加入複習清單</button>`;
      row.querySelector(".add-extract-btn").addEventListener("click", (e) => {
        DataStore.addVocabItem({
          word: v.word,
          definition: v.meaning,
          source_sentence: sentence,
          source_type: materialType
        });
        e.target.textContent = "已加入 ✓";
        e.target.disabled = true;
      });
      vocabListEl.appendChild(row);
    });

    const grammarListEl = resultsEl.querySelector("#dc-grammar-list");
    grammarPoints.forEach((g) => {
      const row = document.createElement("div");
      row.className = "extract-item";
      row.innerHTML = `<strong>${g.pattern}</strong><p class="muted">${g.explanation}</p><button class="btn-secondary add-extract-btn">＋加入複習清單</button>`;
      row.querySelector(".add-extract-btn").addEventListener("click", (e) => {
        DataStore.addVocabItem({
          word: g.pattern,
          definition: g.explanation,
          source_sentence: "",
          source_type: materialType === "reading_test" ? "reading_grammar" : "listening_grammar"
        });
        e.target.textContent = "已加入 ✓";
        e.target.disabled = true;
      });
      grammarListEl.appendChild(row);
    });

    const testPointListEl = resultsEl.querySelector("#dc-testpoint-list");
    testPoints.forEach((t) => {
      const row = document.createElement("div");
      row.className = "extract-item";
      row.innerHTML = `<strong>${t.point}</strong><p class="muted">${t.explanation}</p><button class="btn-secondary add-extract-btn">＋加入複習清單</button>`;
      row.querySelector(".add-extract-btn").addEventListener("click", (e) => {
        DataStore.addVocabItem({
          word: t.point,
          definition: t.explanation,
          source_sentence: "",
          source_type: materialType === "reading_test" ? "reading_testpoint" : "listening_testpoint"
        });
        e.target.textContent = "已加入 ✓";
        e.target.disabled = true;
      });
      testPointListEl.appendChild(row);
    });
  }
};
