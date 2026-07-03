// 每日單字測驗模組(含 Leitner 間隔複習)

const VocabQuiz = {
  state: null,

  mount(container) {
    this.renderStart(container);
  },

  renderStart(container) {
    const stats = Storage.getVocabStats(VOCAB_DATA);
    const due = Storage.getDueVocabWords(VOCAB_DATA, 9999).length;
    container.innerHTML = `
      <div class="card">
        <h2>每日單字測驗</h2>
        <div class="stat-row">
          <div class="stat-box"><span class="stat-num">${stats.mastered}</span><span class="stat-label">已熟練</span></div>
          <div class="stat-box"><span class="stat-num">${stats.learning}</span><span class="stat-label">學習中</span></div>
          <div class="stat-box"><span class="stat-num">${stats.untouched}</span><span class="stat-label">尚未學習</span></div>
          <div class="stat-box"><span class="stat-num">${due}</span><span class="stat-label">今日待複習</span></div>
        </div>
        <p class="muted">系統會優先出「已到複習時間」的單字,答對會進入下一個複習階段,答錯會重新從頭複習。</p>
        <label class="field-label">本次測驗題數</label>
        <select id="vocab-count">
          <option value="10">10 題</option>
          <option value="15" selected>15 題</option>
          <option value="20">20 題</option>
          <option value="30">30 題</option>
        </select>
        <label class="field-label">主題篩選(選填)</label>
        <select id="vocab-category">
          <option value="">全部主題</option>
          ${Object.entries(VOCAB_CATEGORIES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}
        </select>
        <button class="btn-primary" id="vocab-start-btn">開始測驗</button>
      </div>
    `;
    container.querySelector("#vocab-start-btn").addEventListener("click", () => {
      const count = parseInt(container.querySelector("#vocab-count").value, 10);
      const category = container.querySelector("#vocab-category").value;
      this.startQuiz(container, count, category);
    });
  },

  startQuiz(container, count, category) {
    let pool = category ? VOCAB_DATA.filter((w) => w.category === category) : VOCAB_DATA;
    let words = Storage.getDueVocabWords(pool, count);
    if (words.length < count) {
      const usedIds = new Set(words.map((w) => w.id));
      const extra = pool.filter((w) => !usedIds.has(w.id));
      for (let i = extra.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [extra[i], extra[j]] = [extra[j], extra[i]];
      }
      words = words.concat(extra.slice(0, count - words.length));
    }
    this.state = {
      words,
      pool,
      index: 0,
      score: 0,
      total: words.length,
      wrongList: [],
      container
    };
    this.renderQuestion();
  },

  pickDistractors(word, pool, n) {
    const others = pool.filter((w) => w.id !== word.id && w.meaning !== word.meaning);
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    return others.slice(0, n);
  },

  renderQuestion() {
    const s = this.state;
    if (s.index >= s.words.length) {
      return this.renderSummary();
    }
    const word = s.words[s.index];
    const askWordShowMeaning = s.index % 2 === 0;
    const distractors = this.pickDistractors(word, s.pool, 3);
    let options = askWordShowMeaning
      ? [word.meaning, ...distractors.map((d) => d.meaning)]
      : [word.word, ...distractors.map((d) => d.word)];
    const correctValue = options[0];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    const correctIndex = options.indexOf(correctValue);

    s.container.innerHTML = `
      <div class="card">
        <div class="progress-line">第 ${s.index + 1} / ${s.total} 題　${VOCAB_CATEGORIES[word.category]}</div>
        <h2 class="quiz-prompt">${askWordShowMeaning ? word.word + (word.pos ? ` <span class="pos">(${word.pos})</span>` : "") : word.meaning}</h2>
        <p class="muted">${askWordShowMeaning ? "請選出正確的中文意思" : "請選出正確的英文單字"}</p>
        <div id="vocab-options" class="option-list">
          ${options.map((opt, i) => `<button class="option-btn" data-idx="${i}">${opt}</button>`).join("")}
        </div>
        <div id="vocab-feedback"></div>
      </div>
    `;
    s.container.querySelectorAll(".option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.answer(word, parseInt(btn.dataset.idx, 10), correctIndex, askWordShowMeaning, options);
      });
    });
  },

  answer(word, chosenIdx, correctIdx, askWordShowMeaning, options) {
    const s = this.state;
    const buttons = s.container.querySelectorAll(".option-btn");
    buttons.forEach((b) => (b.disabled = true));
    const correct = chosenIdx === correctIdx;
    buttons[correctIdx].classList.add("correct");
    if (!correct) buttons[chosenIdx].classList.add("incorrect");

    Storage.recordVocabAnswer(word.id, correct);
    if (correct) {
      s.score++;
    } else {
      s.wrongList.push(word);
      Storage.addWrongAnswer({
        type: "vocab",
        category: word.category,
        question: askWordShowMeaning ? word.word : word.meaning,
        correctAnswer: options[correctIdx],
        userAnswer: options[chosenIdx]
      });
    }

    const feedback = s.container.querySelector("#vocab-feedback");
    feedback.innerHTML = `
      <div class="feedback ${correct ? "feedback-correct" : "feedback-incorrect"}">
        <p><strong>${word.word}</strong> ${word.pos ? `(${word.pos})` : ""} — ${word.meaning}</p>
        <p class="example">${word.example}</p>
      </div>
      <button class="btn-primary" id="vocab-next-btn">${s.index + 1 < s.total ? "下一題" : "查看結果"}</button>
    `;
    s.container.querySelector("#vocab-next-btn").addEventListener("click", () => {
      s.index++;
      this.renderQuestion();
    });
  },

  renderSummary() {
    const s = this.state;
    const pct = Math.round((s.score / s.total) * 100);
    Storage.addQuizResult({ type: "vocab", score: s.score, total: s.total, percent: pct });
    s.container.innerHTML = `
      <div class="card">
        <h2>測驗結果</h2>
        <p class="result-score">${s.score} / ${s.total}（${pct}%）</p>
        ${s.wrongList.length > 0 ? `<p class="muted">答錯的單字已加入錯題本,會提早排入下次複習。</p>
        <ul class="wrong-list">${s.wrongList.map((w) => `<li><strong>${w.word}</strong> - ${w.meaning}</li>`).join("")}</ul>` : `<p class="muted">全部答對,太厲害了!</p>`}
        <button class="btn-primary" id="vocab-restart-btn">再測一次</button>
      </div>
    `;
    s.container.querySelector("#vocab-restart-btn").addEventListener("click", () => {
      this.renderStart(s.container);
    });
  }
};
