/**
 * 每日快速複習(需求文件 3.7 節功能三)
 *
 * FSRS 到期複習清單的呈現介面:卡片正面顯示「情境句(單字挖空)」,
 * 背面顯示「音標+翻譯+原句」,依記得/不記得等四個等級評分,交給
 * js/fsrs.js 動態計算下次複習時間。
 */

const VocabReview = {
  mount(container) {
    this.container = container;
    this.queue = DataStore.getDueVocabItems();
    this.index = 0;
    this.revealed = false;
    this.stats = { again: 0, hard: 0, good: 0, easy: 0 };
    this.render();
  },

  renderStatsFooter() {
    const all = DataStore.getAll("vocabItems");
    const mastered = all.filter((v) => v.srs_state === 2 && v.srs_interval >= 21).length;
    const learning = all.length - mastered;
    return `
      <div class="card">
        <h3>單字清單總覽</h3>
        <div class="stat-row">
          <div class="stat-box"><span class="stat-num">${all.length}</span><span class="stat-label">總數</span></div>
          <div class="stat-box"><span class="stat-num">${mastered}</span><span class="stat-label">已穩定(間隔≥21天)</span></div>
          <div class="stat-box"><span class="stat-num">${learning}</span><span class="stat-label">學習中</span></div>
        </div>
      </div>
    `;
  },

  render() {
    if (this.index >= this.queue.length) {
      this.renderSummary();
      return;
    }
    const item = this.queue[this.index];
    const blanked = item.source_sentence
      ? item.source_sentence.replace(new RegExp(escapeRegExp(item.word), "gi"), "____")
      : "(沒有情境句)";

    this.container.innerHTML = `
      <div class="card">
        <div class="progress-line">複習中 ${this.index + 1} / ${this.queue.length}</div>
        <div class="review-card">
          <p class="rc-sentence">${blanked}</p>
          ${this.revealed
            ? `
            <div class="rc-back">
              <p class="rc-word">${item.word} ${item.phonetic ? `<span class="pos">[${item.phonetic}]</span>` : ""}</p>
              <p class="rc-meaning">${item.definition}</p>
              ${item.source_sentence ? `<p class="muted">${item.source_sentence}</p>` : ""}
            </div>
            <div class="rc-grades">
              <button class="rc-grade-btn rc-again" data-grade="1">忘記了</button>
              <button class="rc-grade-btn rc-hard" data-grade="2">有點難</button>
              <button class="rc-grade-btn rc-good" data-grade="3">記得</button>
              <button class="rc-grade-btn rc-easy" data-grade="4">很簡單</button>
            </div>`
            : `<button class="btn-primary" id="rc-reveal-btn">顯示答案</button>`}
        </div>
      </div>
      ${this.renderStatsFooter()}
    `;

    if (!this.revealed) {
      this.container.querySelector("#rc-reveal-btn").addEventListener("click", () => {
        this.revealed = true;
        this.render();
      });
    } else {
      this.container.querySelectorAll(".rc-grade-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const grade = parseInt(btn.dataset.grade, 10);
          FSRS.review(item, grade);
          const key = { 1: "again", 2: "hard", 3: "good", 4: "easy" }[grade];
          this.stats[key]++;
          this.index++;
          this.revealed = false;
          this.render();
        });
      });
    }
  },

  renderSummary() {
    const total = this.queue.length;
    this.container.innerHTML = `
      <div class="card">
        <h2>今天的複習完成了!</h2>
        ${total === 0 ? `<p class="muted">目前沒有到期的單字,可以到「拆解器」或閱讀時用滑鼠停留在單字上加入新的複習項目。</p>` : `
        <p class="result-score">共複習 ${total} 個項目</p>
        <ul>
          <li>忘記:${this.stats.again}</li>
          <li>有點難:${this.stats.hard}</li>
          <li>記得:${this.stats.good}</li>
          <li>很簡單:${this.stats.easy}</li>
        </ul>`}
        <button class="btn-primary" id="rc-restart-btn">重新檢查是否有新到期項目</button>
      </div>
      ${this.renderStatsFooter()}
    `;
    this.container.querySelector("#rc-restart-btn").addEventListener("click", () => this.mount(this.container));
  }
};

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
