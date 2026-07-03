// 文法/閱讀限時模考模組 (Part5 / Part6 / Part7 風格)

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function shuffleCopy(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MOCK_PRESETS = [
  { id: "part5", label: "Part 5・文法選擇(15題 / 10分鐘)", minutes: 10 },
  { id: "part6", label: "Part 6・短文填空(3篇 / 12題 / 10分鐘)", minutes: 10 },
  { id: "part7single", label: "Part 7・單篇閱讀(3篇 / 9題 / 12分鐘)", minutes: 12 },
  { id: "part7double", label: "Part 7・雙篇閱讀(2組 / 10題 / 12分鐘)", minutes: 12 },
  { id: "full", label: "綜合模考・Part5+6+7(45分鐘)", minutes: 45 }
];

const MockTest = {
  state: null,
  timerHandle: null,

  mount(container) {
    container.innerHTML = `
      <div class="card">
        <h2>文法/閱讀限時模考</h2>
        <p class="muted">選擇一種模考模式,時間到會自動交卷。作答時盡量比照真實考試,不要中途查字典。</p>
        <div id="mock-preset-list" class="preset-list">
          ${MOCK_PRESETS.map((p) => `<button class="preset-btn" data-id="${p.id}">${p.label}</button>`).join("")}
        </div>
      </div>
    `;
    container.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.start(container, btn.dataset.id));
    });
  },

  buildUnits(presetId) {
    const units = []; // { name, type, category, promptHtml, options, answer, explanation }
    const passageBlocks = []; // { headerHtml, unitNames }

    const addGrammar = (n) => {
      const items = shuffleCopy(GRAMMAR_DATA).slice(0, n);
      items.forEach((q) => {
        units.push({
          name: `g-${q.id}`,
          type: "grammar",
          category: q.category,
          promptHtml: `<p>${escapeHtml(q.sentence)}</p>`,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation,
          questionText: q.sentence
        });
      });
      if (items.length) {
        passageBlocks.push({
          headerHtml: `<h3>Part 5・文法選擇</h3>`,
          groups: items.map((q) => ({ passageHtml: "", unitNames: [`g-${q.id}`] }))
        });
      }
    };

    const addPart6 = (n) => {
      const passages = shuffleCopy(PART6_DATA).slice(0, n);
      const groups = [];
      passages.forEach((p) => {
        const names = [];
        p.blanks.forEach((b) => {
          const name = `p6-${p.id}-${b.num}`;
          names.push(name);
          units.push({
            name,
            type: "part6",
            category: "reading-part6",
            promptHtml: `<p>空格 (${b.num})</p>`,
            options: b.options,
            answer: b.answer,
            explanation: b.explanation,
            questionText: `[${p.title}] blank ${b.num}`
          });
        });
        groups.push({
          passageHtml: `<pre class="passage-text">${escapeHtml(p.text)}</pre>`,
          unitNames: names
        });
      });
      if (passages.length) {
        passageBlocks.push({ headerHtml: `<h3>Part 6・短文填空</h3>`, groups });
      }
    };

    const addPart7Single = (n) => {
      const passages = shuffleCopy(PART7_SINGLE_DATA).slice(0, n);
      const groups = [];
      passages.forEach((p) => {
        const names = [];
        p.questions.forEach((q, qi) => {
          const name = `p7s-${p.id}-${qi}`;
          names.push(name);
          units.push({
            name,
            type: "part7",
            category: "reading-part7",
            promptHtml: `<p>${escapeHtml(q.q)}</p>`,
            options: q.options,
            answer: q.answer,
            explanation: null,
            questionText: q.q
          });
        });
        groups.push({
          passageHtml: `<h4>${escapeHtml(p.title)}</h4><pre class="passage-text">${escapeHtml(p.text)}</pre>`,
          unitNames: names
        });
      });
      if (passages.length) {
        passageBlocks.push({ headerHtml: `<h3>Part 7・單篇閱讀</h3>`, groups });
      }
    };

    const addPart7Double = (n) => {
      const passages = shuffleCopy(PART7_DOUBLE_DATA).slice(0, n);
      const groups = [];
      passages.forEach((p) => {
        const names = [];
        p.questions.forEach((q, qi) => {
          const name = `p7d-${p.id}-${qi}`;
          names.push(name);
          units.push({
            name,
            type: "part7",
            category: "reading-part7",
            promptHtml: `<p>${escapeHtml(q.q)}</p>`,
            options: q.options,
            answer: q.answer,
            explanation: null,
            questionText: q.q
          });
        });
        groups.push({
          passageHtml: `<h4>${escapeHtml(p.title)}</h4>
            <div class="double-passage"><div><strong>${escapeHtml(p.passageA.label)}</strong><pre class="passage-text">${escapeHtml(p.passageA.text)}</pre></div>
            <div><strong>${escapeHtml(p.passageB.label)}</strong><pre class="passage-text">${escapeHtml(p.passageB.text)}</pre></div></div>`,
          unitNames: names
        });
      });
      if (passages.length) {
        passageBlocks.push({ headerHtml: `<h3>Part 7・雙篇閱讀</h3>`, groups });
      }
    };

    if (presetId === "part5") addGrammar(15);
    else if (presetId === "part6") addPart6(3);
    else if (presetId === "part7single") addPart7Single(3);
    else if (presetId === "part7double") addPart7Double(2);
    else if (presetId === "full") {
      addGrammar(15);
      addPart6(3);
      addPart7Single(3);
      addPart7Double(1);
    }

    return { units, passageBlocks };
  },

  start(container, presetId) {
    const preset = MOCK_PRESETS.find((p) => p.id === presetId);
    const { units, passageBlocks } = this.buildUnits(presetId);
    this.state = {
      container,
      preset,
      units,
      secondsLeft: preset.minutes * 60,
      submitted: false
    };
    this.renderForm(passageBlocks);
    this.startTimer();
  },

  renderForm(passageBlocks) {
    const s = this.state;
    let questionCounter = 0;
    const bodyHtml = passageBlocks
      .map((block) => {
        const groupsHtml = block.groups
          .map((g) => {
            const qHtml = g.unitNames
              .map((name) => {
                const unit = s.units.find((u) => u.name === name);
                questionCounter++;
                return `
                <div class="mock-question">
                  <p class="q-number">${questionCounter}.</p>
                  ${unit.promptHtml}
                  <div class="option-list-inline">
                    ${unit.options.map((opt, oi) => `<label class="radio-option"><input type="radio" name="${unit.name}" value="${oi}"> ${String.fromCharCode(65 + oi)}. ${escapeHtml(opt)}</label>`).join("")}
                  </div>
                </div>`;
              })
              .join("");
            return `<div class="mock-passage">${g.passageHtml}${qHtml}</div>`;
          })
          .join("");
        return `<div class="mock-section">${block.headerHtml}${groupsHtml}</div>`;
      })
      .join("");

    s.container.innerHTML = `
      <div class="mock-header">
        <div>${s.preset.label}（共 ${s.units.length} 題）</div>
        <div id="mock-timer" class="mock-timer"></div>
      </div>
      <div id="mock-body">${bodyHtml}</div>
      <button class="btn-primary" id="mock-submit-btn">交卷</button>
    `;
    s.container.querySelector("#mock-submit-btn").addEventListener("click", () => this.submit());
    this.updateTimerDisplay();
  },

  startTimer() {
    clearInterval(this.timerHandle);
    this.timerHandle = setInterval(() => {
      this.state.secondsLeft--;
      this.updateTimerDisplay();
      if (this.state.secondsLeft <= 0) {
        clearInterval(this.timerHandle);
        this.submit();
      }
    }, 1000);
  },

  updateTimerDisplay() {
    const s = this.state;
    const el = s.container.querySelector("#mock-timer");
    if (!el) return;
    const m = Math.max(Math.floor(s.secondsLeft / 60), 0);
    const sec = Math.max(s.secondsLeft % 60, 0);
    el.textContent = `剩餘時間 ${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    if (s.secondsLeft <= 60) el.classList.add("timer-warning");
  },

  submit() {
    const s = this.state;
    if (s.submitted) return;
    s.submitted = true;
    clearInterval(this.timerHandle);

    let score = 0;
    const breakdown = {};
    const wrongDetails = [];

    s.units.forEach((unit) => {
      const checked = s.container.querySelector(`input[name="${unit.name}"]:checked`);
      const chosenIdx = checked ? parseInt(checked.value, 10) : -1;
      const correct = chosenIdx === unit.answer;
      breakdown[unit.type] = breakdown[unit.type] || { correct: 0, total: 0 };
      breakdown[unit.type].total++;
      if (correct) {
        score++;
        breakdown[unit.type].correct++;
      } else {
        wrongDetails.push(unit);
        Storage.addWrongAnswer({
          type: unit.type,
          category: unit.category,
          question: unit.questionText,
          correctAnswer: unit.options[unit.answer],
          userAnswer: chosenIdx >= 0 ? unit.options[chosenIdx] : "(未作答)"
        });
      }
    });

    Storage.addQuizResult({
      type: "mock-" + s.preset.id,
      score,
      total: s.units.length,
      percent: Math.round((score / s.units.length) * 100)
    });

    this.renderResult(score, breakdown, wrongDetails);
  },

  renderResult(score, breakdown, wrongDetails) {
    const s = this.state;
    const pct = Math.round((score / s.units.length) * 100);
    const breakdownHtml = Object.entries(breakdown)
      .map(([type, v]) => `<li>${type}: ${v.correct} / ${v.total}</li>`)
      .join("");
    const wrongHtml = wrongDetails
      .map(
        (u) => `
      <div class="review-item">
        <p class="review-q">${u.promptHtml}</p>
        <p class="review-correct">正確答案:${escapeHtml(u.options[u.answer])}</p>
        ${u.explanation ? `<p class="review-explain">${escapeHtml(u.explanation)}</p>` : ""}
      </div>`
      )
      .join("");

    s.container.innerHTML = `
      <div class="card">
        <h2>模考結果</h2>
        <p class="result-score">${score} / ${s.units.length}（${pct}%）</p>
        <ul class="breakdown-list">${breakdownHtml}</ul>
        ${wrongDetails.length ? `<h3>錯題檢討</h3>${wrongHtml}` : `<p class="muted">全對!非常出色。</p>`}
        <button class="btn-primary" id="mock-again-btn">回到模考選單</button>
      </div>
    `;
    s.container.querySelector("#mock-again-btn").addEventListener("click", () => this.mount(s.container));
  }
};
