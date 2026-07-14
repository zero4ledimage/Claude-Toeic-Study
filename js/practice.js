/**
 * 測驗練習模組 — 邊測邊學(需求文件 3.10 節)
 *
 * 兩種模式:
 *  - 每日練功(drill):平日零碎時間用。一組 5–10 題,做到哪存到哪、可中斷續做;
 *    答錯立即顯示正解 + 可按「AI 講解」;錯題寫入錯題本(3.5),錯的單字排入 FSRS(3.1)。
 *  - 週末模考(mock):計時仿真,可暫停/分兩段完成;交卷後估分並寫入進度紀錄(3.6)。
 *
 * 題源(3.10.3):單字優先用使用者自己存的 vocab_items,不足時用 practice-bank.js 的種子字庫;
 * 文法/閱讀用種子題庫。全為原創/本地資料,不含官方版權題。
 */

const PRACTICE_SESSION_KEY = "tls_practice_session";

function prShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 把 ECDICT 字典的釋義清乾淨:去掉開頭詞性標記(a./vt./n.…)與 [計] 之類方括號註記,
// 取前 1-2 個中文義,長度合理才回傳,否則回空字串(該字就不拿來出題)。
function prCleanMeaning(raw) {
  if (!raw) return "";
  let m = String(raw).split(/[;；\r\n]/)[0].trim();
  m = m.replace(/^(n|v|vt|vi|a|ad|adj|adv|prep|conj|pron|art|int|num|aux|abbr|pl)\.\s*/i, "");
  m = m.replace(/\[[^\]]*\]/g, "").trim();
  const parts = m.split(/[,，、]/).map((s) => s.trim()).filter(Boolean).slice(0, 2);
  m = parts.join("、");
  if (!/[一-鿿]/.test(m)) return "";
  return m.length > 18 ? m.slice(0, 18) : m;
}

const Practice = {
  session: null, // 進行中的一組題目(drill 或 mock)
  _timer: null,

  mount(container) {
    this.container = container;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this.session = this._loadSession();
    if (this.session && this.session.finished) { this._clearSession(); this.session = null; }
    if (this.session) {
      // 有未完成的練習 → 直接回到作答畫面
      if (this.session.mode === "mock") this._renderMockQuestion();
      else this._renderDrillQuestion();
    } else {
      this.renderHome();
    }
  },

  // ---------------- 首頁 ----------------
  renderHome() {
    const savedVocab = DataStore.getAll("vocabItems").length;
    this.container.innerHTML = `
      <div class="card">
        <h2>每日練功</h2>
        <p class="muted">平日零碎時間用:一組題目做到哪存到哪,隨時中斷、下次接著做。答錯立刻看正解,還能按「AI 講解」。</p>
        <div class="field-inline">
          <select id="pr-drill-type">
            <option value="mixed">混合(單字+文法+閱讀)</option>
            <option value="vocab">只做單字</option>
            <option value="grammar">只做文法</option>
            <option value="reading">只做閱讀</option>
          </select>
          <select id="pr-drill-count">
            <option value="5">5 題</option>
            <option value="10" selected>10 題</option>
            <option value="20">20 題</option>
          </select>
          <button class="btn-primary" id="pr-start-drill">開始練功</button>
        </div>
        <p class="muted">單字題庫:你已收藏 ${savedVocab} 字 + 內建字庫(從本地字典約 1.7 萬字出題)。收藏的字會優先出題。</p>
      </div>

      <div class="card">
        <h2>週末模考</h2>
        <p class="muted">週末完整時段用:計時仿真、作答中不看答案,交卷後才估分與檢討。可按「暫停並儲存」分兩段完成。</p>
        <div class="field-inline">
          <select id="pr-mock-type">
            <option value="grammarreading">文法 + 閱讀</option>
            <option value="grammar">只考文法</option>
            <option value="reading">只考閱讀</option>
          </select>
          <select id="pr-mock-count">
            <option value="15">15 題(約 11 分)</option>
            <option value="20" selected>20 題(約 15 分)</option>
            <option value="30">30 題(約 23 分)</option>
          </select>
          <button class="btn-primary" id="pr-start-mock">開始模考</button>
        </div>
        <div id="pr-mock-history"></div>
      </div>
    `;

    this.container.querySelector("#pr-start-drill").addEventListener("click", () => {
      const type = this.container.querySelector("#pr-drill-type").value;
      const count = parseInt(this.container.querySelector("#pr-drill-count").value, 10);
      this._startDrill(type, count);
    });
    this.container.querySelector("#pr-start-mock").addEventListener("click", () => {
      const type = this.container.querySelector("#pr-mock-type").value;
      const count = parseInt(this.container.querySelector("#pr-mock-count").value, 10);
      this._startMock(type, count);
    });

    this._renderMockHistory();
  },

  _renderMockHistory() {
    const el = this.container.querySelector("#pr-mock-history");
    if (!el) return;
    const records = DataStore.getAll("progressRecords")
      .filter((r) => r.source === "self_practice" && r.test_type === "toeic")
      .slice(-5)
      .reverse();
    if (records.length === 0) {
      el.innerHTML = `<p class="muted">尚無模考紀錄。</p>`;
      return;
    }
    el.innerHTML =
      `<p class="muted">最近的練習估分(僅供參考,非官方分數):</p>` +
      records.map((r) => `<div class="review-meta">${escapeHtml(r.date)} · 閱讀練習估分約 <strong>${r.score}</strong> / 495</div>`).join("");
  },

  // ---------------- 題目建構 ----------------
  _dictPool: null,
  // 從已載入的本地字典(21,666 詞條)建一個乾淨的單字題池(約 1.7 萬字),只建一次快取起來。
  _buildDictPool() {
    if (this._dictPool) return this._dictPool;
    const dict = typeof VocabLookup !== "undefined" ? VocabLookup.dict : null;
    if (!dict) return [];
    const pool = [];
    for (const key in dict) {
      const e = dict[key];
      const word = e.word || key;
      if (!/^[a-z]+$/.test(word) || word.length < 3) continue; // 只要單一英文字、跳過過短功能詞
      const meaning = prCleanMeaning(e.meaning);
      if (!meaning) continue;
      pool.push({ word, meaning, pos: "", example: "", phonetic: e.kk || "" });
    }
    this._dictPool = pool;
    return pool;
  },

  // 若題型需要單字,確保字典已載入(async);其餘題型不需等待。
  _ensureVocabReady(type) {
    const needsVocab = type === "vocab" || type === "mixed";
    if (needsVocab && typeof VocabLookup !== "undefined") return VocabLookup.loadDictionary();
    return Promise.resolve();
  },

  _vocabPool() {
    const saved = DataStore.getAll("vocabItems").map((v) => ({
      word: v.word, meaning: v.definition, pos: "", example: v.source_sentence || "", phonetic: v.phonetic || ""
    }));
    const seen = new Set(saved.map((v) => v.word.toLowerCase()));
    const seed = PRACTICE_VOCAB.filter((v) => !seen.has(v.word.toLowerCase()));
    seed.forEach((v) => seen.add(v.word.toLowerCase()));
    const dict = this._buildDictPool().filter((v) => !seen.has(v.word.toLowerCase()));
    // 收藏的字 → 內建種子 → 字典(共約 1.7 萬字),前段優先個人化,整體出題時再隨機
    return saved.filter((v) => v.meaning).concat(seed).concat(dict);
  },

  _buildVocabQuestions(n) {
    const pool = this._vocabPool();
    const usable = pool.filter((v) => v.meaning && v.meaning.trim());
    if (usable.length < 4) return [];
    // 優先使用者收藏的字(pool 前段),但整體隨機
    const chosen = prShuffle(usable).slice(0, n);
    return chosen.map((v) => {
      const distractors = prShuffle(usable.filter((o) => o.meaning !== v.meaning)).slice(0, 3);
      const options = prShuffle([v.meaning, ...distractors.map((d) => d.meaning)]);
      return {
        type: "vocab",
        prompt: `${v.word}${v.pos ? ` (${v.pos})` : ""}`,
        subPrompt: "請選出正確的中文意思",
        passage: null,
        options,
        answer: options.indexOf(v.meaning),
        explanation: v.example ? `例句:${v.example}` : "",
        meta: { word: v.word, meaning: v.meaning, example: v.example, phonetic: v.phonetic }
      };
    });
  },

  _buildGrammarQuestions(n) {
    return prShuffle(PRACTICE_GRAMMAR).slice(0, n).map((q) => ({
      type: "grammar",
      prompt: q.sentence,
      subPrompt: "選出最適合填入空格的選項",
      passage: null,
      options: q.options.slice(),
      answer: q.answer,
      explanation: q.explanation,
      meta: { category: q.category }
    }));
  },

  _buildReadingQuestions(n) {
    // 展開所有 (passage, question) 組合再抽樣
    const all = [];
    PRACTICE_READING.forEach((p) => {
      p.questions.forEach((q) => {
        all.push({
          type: "reading",
          prompt: q.q,
          subPrompt: "閱讀短文後作答",
          passage: { title: p.title, text: p.text },
          options: q.options.slice(),
          answer: q.answer,
          explanation: "",
          meta: {}
        });
      });
    });
    return prShuffle(all).slice(0, n);
  },

  _buildQuestions(type, count) {
    if (type === "vocab") return this._buildVocabQuestions(count);
    if (type === "grammar") return this._buildGrammarQuestions(count);
    if (type === "reading") return this._buildReadingQuestions(count);
    if (type === "grammarreading") {
      const half = Math.ceil(count / 2);
      return prShuffle(this._buildGrammarQuestions(half).concat(this._buildReadingQuestions(count - half)));
    }
    // mixed
    const perType = Math.max(1, Math.round(count / 3));
    const qs = this._buildVocabQuestions(perType)
      .concat(this._buildGrammarQuestions(perType))
      .concat(this._buildReadingQuestions(count - perType * 2));
    return prShuffle(qs).slice(0, count);
  },

  // ---------------- session 儲存/讀取 ----------------
  _saveSession() {
    if (this.session) localStorage.setItem(PRACTICE_SESSION_KEY, JSON.stringify(this.session));
  },
  _loadSession() {
    try {
      const raw = localStorage.getItem(PRACTICE_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },
  _clearSession() {
    localStorage.removeItem(PRACTICE_SESSION_KEY);
  },

  // ================= 每日練功 =================
  async _startDrill(type, count) {
    await this._ensureVocabReady(type);
    const questions = this._buildQuestions(type, count);
    if (questions.length === 0) {
      alert("目前可用題目不足,請改選其他題型或先用拆解器收藏一些單字。");
      return;
    }
    this.session = {
      mode: "drill", type, index: 0, questions,
      answers: new Array(questions.length).fill(null),
      finished: false, startedAt: new Date().toISOString()
    };
    this._saveSession();
    this._renderDrillQuestion();
  },

  _renderDrillQuestion() {
    const s = this.session;
    if (s.index >= s.questions.length) return this._renderDrillSummary();
    const q = s.questions[s.index];
    const answered = s.answers[s.index];
    this.container.innerHTML = `
      <div class="card">
        <div class="pr-topbar">
          <span class="pr-progress">練功 ${s.index + 1} / ${s.questions.length}・${this._typeLabel(q.type)}</span>
          <button class="btn-secondary" id="pr-quit">存檔並離開</button>
        </div>
        ${q.passage ? `<div class="pr-passage"><strong>${escapeHtml(q.passage.title)}</strong><pre class="passage-text">${escapeHtml(q.passage.text)}</pre></div>` : ""}
        <h2 class="pr-prompt">${escapeHtml(q.prompt)}</h2>
        <p class="muted">${escapeHtml(q.subPrompt || "")}</p>
        <div class="pr-options" id="pr-options">
          ${q.options.map((opt, i) => `<button class="pr-option" data-i="${i}">${escapeHtml(opt)}</button>`).join("")}
        </div>
        <div id="pr-feedback"></div>
      </div>
    `;
    this.container.querySelector("#pr-quit").addEventListener("click", () => { this._saveSession(); this.renderHome(); });

    const optionsEl = this.container.querySelector("#pr-options");
    if (answered !== null) {
      this._revealDrill(q, answered);
    } else {
      optionsEl.querySelectorAll(".pr-option").forEach((btn) => {
        btn.addEventListener("click", () => this._answerDrill(parseInt(btn.dataset.i, 10)));
      });
    }
  },

  _answerDrill(chosen) {
    const s = this.session;
    const q = s.questions[s.index];
    s.answers[s.index] = chosen;
    const correct = chosen === q.answer;
    if (!correct) this._recordWrong(q, chosen);
    this._saveSession();
    this._revealDrill(q, chosen);
  },

  _revealDrill(q, chosen) {
    const correct = chosen === q.answer;
    const btns = this.container.querySelectorAll("#pr-options .pr-option");
    btns.forEach((b, i) => {
      b.disabled = true;
      if (i === q.answer) b.classList.add("correct");
      else if (i === chosen) b.classList.add("incorrect");
    });
    const fb = this.container.querySelector("#pr-feedback");
    const isLast = this.session.index + 1 >= this.session.questions.length;
    fb.innerHTML = `
      <div class="pr-fb ${correct ? "pr-fb-ok" : "pr-fb-bad"}">
        <p>${correct ? "✅ 答對了" : "❌ 答錯了"}　正解:<strong>${escapeHtml(q.options[q.answer])}</strong></p>
        ${q.explanation ? `<p class="muted">${escapeHtml(q.explanation)}</p>` : ""}
        ${q.meta && q.meta.phonetic ? `<p class="muted">KK:[${escapeHtml(q.meta.phonetic)}]</p>` : ""}
      </div>
      ${!correct ? `<button class="btn-secondary" id="pr-ai-explain">AI 講解為什麼</button><div id="pr-ai-out" class="el-ai-result" style="display:none;"></div>` : ""}
      <button class="btn-primary" id="pr-next">${isLast ? "看結果" : "下一題"}</button>
    `;
    const aiBtn = this.container.querySelector("#pr-ai-explain");
    if (aiBtn) aiBtn.addEventListener("click", () => this._aiExplain(q, chosen, aiBtn));
    this.container.querySelector("#pr-next").addEventListener("click", () => {
      this.session.index++;
      this._saveSession();
      this._renderDrillQuestion();
    });
  },

  async _aiExplain(q, chosen, btn) {
    const out = this.container.querySelector("#pr-ai-out");
    btn.disabled = true;
    btn.textContent = "講解產生中…";
    try {
      const resp = await ApiClient.callClaude({
        model: CONFIG.MODELS.HAIKU,
        maxTokens: 400,
        system: "你是多益/雅思英語教學助理,只用繁體中文,簡潔清楚,不要客套。",
        messages: [{
          role: "user",
          content: `題目:${q.prompt}\n選項:${q.options.map((o, i) => `(${String.fromCharCode(65 + i)}) ${o}`).join("　")}\n我選了:${q.options[chosen]}(錯)\n正確答案:${q.options[q.answer]}\n請解釋為什麼正解是對的、我錯在哪個觀念,並補一句類似用法的英文例句。控制在 4 句內。`
        }]
      });
      out.textContent = ApiClient.extractText(resp);
      out.style.display = "block";
      btn.textContent = "已講解";
    } catch (err) {
      out.textContent = err.needsSignIn ? "登入 Google 帳號後才能使用 AI 講解。" : (err.message || "講解失敗,請稍後再試。");
      out.style.display = "block";
      btn.disabled = false;
      btn.textContent = "AI 講解為什麼";
    }
  },

  _renderDrillSummary() {
    const s = this.session;
    const score = s.answers.reduce((sum, a, i) => sum + (a === s.questions[i].answer ? 1 : 0), 0);
    const wrong = s.questions.filter((q, i) => s.answers[i] !== q.answer);
    s.finished = true;
    this._clearSession();
    this.container.innerHTML = `
      <div class="card">
        <h2>練功結果</h2>
        <p class="result-score">${score} / ${s.questions.length}</p>
        ${wrong.length
          ? `<p class="muted">答錯的已加入錯題本,錯的單字也排入了 FSRS 複習佇列。</p>
             <div>${wrong.map((q) => `<div class="review-item"><p class="review-q">${escapeHtml(q.prompt)}</p><p class="review-correct">正解:${escapeHtml(q.options[q.answer])}</p></div>`).join("")}</div>`
          : `<p class="muted">全部答對,太棒了!</p>`}
        <button class="btn-primary" id="pr-again">再練一組</button>
      </div>
    `;
    this.session = null;
    this.container.querySelector("#pr-again").addEventListener("click", () => this.renderHome());
  },

  // ================= 週末模考 =================
  _startMock(type, count) {
    const questions = this._buildQuestions(type, count);
    if (questions.length === 0) { alert("目前可用題目不足,請改選其他題型。"); return; }
    this.session = {
      mode: "mock", type, index: 0, questions,
      answers: new Array(questions.length).fill(null),
      remainingSeconds: questions.length * 45,
      running: true, finished: false, startedAt: new Date().toISOString()
    };
    this._saveSession();
    this._renderMockQuestion();
  },

  _renderMockQuestion() {
    const s = this.session;
    const q = s.questions[s.index];
    this.container.innerHTML = `
      <div class="card">
        <div class="pr-topbar">
          <span class="pr-progress">模考 ${s.index + 1} / ${s.questions.length}</span>
          <span id="pr-timer" class="pr-timer"></span>
        </div>
        ${q.passage ? `<div class="pr-passage"><strong>${escapeHtml(q.passage.title)}</strong><pre class="passage-text">${escapeHtml(q.passage.text)}</pre></div>` : ""}
        <h2 class="pr-prompt">${escapeHtml(q.prompt)}</h2>
        <p class="muted">${escapeHtml(q.subPrompt || "")}</p>
        <div class="pr-options" id="pr-options">
          ${q.options.map((opt, i) => `<button class="pr-option ${s.answers[s.index] === i ? "selected" : ""}" data-i="${i}">${escapeHtml(opt)}</button>`).join("")}
        </div>
        <div class="pr-navrow">
          <button class="btn-secondary" id="pr-prev" ${s.index === 0 ? "disabled" : ""}>上一題</button>
          <button class="btn-secondary" id="pr-pause">暫停並儲存</button>
          ${s.index + 1 < s.questions.length
            ? `<button class="btn-primary" id="pr-next">下一題</button>`
            : `<button class="btn-primary" id="pr-submit">交卷</button>`}
        </div>
        <p class="muted">作答中不顯示答案;可按「暫停並儲存」離開,下次回到這裡接著做(分兩段)。</p>
      </div>
    `;

    this.container.querySelectorAll("#pr-options .pr-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        s.answers[s.index] = parseInt(btn.dataset.i, 10);
        this._saveSession();
        this.container.querySelectorAll("#pr-options .pr-option").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });
    const prev = this.container.querySelector("#pr-prev");
    if (prev) prev.addEventListener("click", () => { s.index--; this._saveSession(); this._renderMockQuestion(); });
    const next = this.container.querySelector("#pr-next");
    if (next) next.addEventListener("click", () => { s.index++; this._saveSession(); this._renderMockQuestion(); });
    const submit = this.container.querySelector("#pr-submit");
    if (submit) submit.addEventListener("click", () => this._submitMock());
    this.container.querySelector("#pr-pause").addEventListener("click", () => {
      s.running = false; this._saveSession();
      if (this._timer) { clearInterval(this._timer); this._timer = null; }
      this.renderHome();
    });

    // 計時:回到模考畫面就繼續跑(續做)
    s.running = true;
    this._saveSession();
    this._startTimer();
    this._updateTimerDisplay();
  },

  _startTimer() {
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      if (!this.session || this.session.mode !== "mock" || !this.session.running) return;
      this.session.remainingSeconds--;
      this._saveSession();
      this._updateTimerDisplay();
      if (this.session.remainingSeconds <= 0) {
        clearInterval(this._timer); this._timer = null;
        this._submitMock(true);
      }
    }, 1000);
  },

  _updateTimerDisplay() {
    const el = this.container.querySelector("#pr-timer");
    if (!el || !this.session) return;
    const sec = Math.max(this.session.remainingSeconds, 0);
    const m = Math.floor(sec / 60);
    const r = sec % 60;
    el.textContent = `剩餘 ${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
    el.classList.toggle("warn", sec <= 60);
  },

  _submitMock(timeUp) {
    const s = this.session;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    let score = 0;
    s.questions.forEach((q, i) => {
      if (s.answers[i] === q.answer) score++;
      else if (s.answers[i] !== null || timeUp) this._recordWrong(q, s.answers[i]);
    });
    const pct = Math.round((score / s.questions.length) * 100);
    // 粗略換算閱讀單項估分(5–495),清楚標示僅供參考,非官方分數
    const estReading = Math.round(5 + (pct / 100) * (495 - 5));
    DataStore.addProgressRecord({ test_type: "toeic", skill: "reading", score: estReading, source: "self_practice" });
    s.finished = true;
    this._clearSession();

    const wrong = s.questions.map((q, i) => ({ q, chosen: s.answers[i] })).filter((x) => x.chosen !== x.q.answer);
    this.container.innerHTML = `
      <div class="card">
        <h2>模考結果${timeUp ? "(時間到,自動交卷)" : ""}</h2>
        <p class="result-score">${score} / ${s.questions.length}(${pct}%)</p>
        <p class="muted">粗略閱讀估分約 <strong>${estReading}</strong> / 495 —— 這是本地練習題的估算,<strong>僅供追蹤趨勢,非官方分數</strong>。真正的分數校準請用官方紙本模擬考(見模考排程分頁)。已寫入進度紀錄。</p>
        ${wrong.length
          ? `<h3>錯題檢討(${wrong.length})</h3>${wrong.map(({ q }) => `
              <div class="review-item">
                <p class="review-q">${escapeHtml(q.prompt)}</p>
                <p class="review-correct">正解:${escapeHtml(q.options[q.answer])}</p>
                ${q.explanation ? `<p class="muted">${escapeHtml(q.explanation)}</p>` : ""}
              </div>`).join("")}`
          : `<p class="muted">全部答對,表現出色!</p>`}
        <button class="btn-primary" id="pr-mock-done">回到測驗練習</button>
      </div>
    `;
    this.session = null;
    this.container.querySelector("#pr-mock-done").addEventListener("click", () => this.renderHome());
  },

  // ---------------- 共用:記錄錯題 + 單字進 FSRS ----------------
  _recordWrong(q, chosen) {
    const category = q.type === "vocab" ? "vocab" : q.type === "grammar" ? "grammar" : "logic";
    DataStore.addErrorLogEntry({
      skill_type: "reading",
      error_category: category,
      original_content: `${q.prompt}${chosen !== null && chosen !== undefined ? `\n我選:${q.options[chosen]}` : "\n(未作答)"}`,
      correction: `正解:${q.options[q.answer]}${q.explanation ? `\n${q.explanation}` : ""}`,
      related_vocab_ids: []
    });
    if (q.type === "vocab" && q.meta && q.meta.word) {
      const item = DataStore.addVocabItem({
        word: q.meta.word, phonetic: q.meta.phonetic || "", definition: q.meta.meaning,
        source_sentence: q.meta.example || "", source_type: "manual"
      });
      if (item) FSRS.review(item, FSRS.GRADE.AGAIN);
    }
  },

  _typeLabel(t) {
    return { vocab: "單字", grammar: "文法", reading: "閱讀" }[t] || t;
  }
};
