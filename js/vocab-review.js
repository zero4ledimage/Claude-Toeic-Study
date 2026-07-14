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
    // 功能四(3.11):單字卡與語塊卡在同一 FSRS 佇列混合
    const vocab = DataStore.getDueVocabItems().map((item) => ({ kind: "vocab", item }));
    const chunks = DataStore.getDueChunkItems().map((item) => ({ kind: "chunk", item }));
    this.queue = this._shuffle(vocab.concat(chunks));
    this.index = 0;
    this.revealed = false;
    this.stats = { again: 0, hard: 0, good: 0, easy: 0 };
    this.render();
  },

  _shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  renderStatsFooter() {
    const all = DataStore.getAll("vocabItems");
    const mastered = all.filter((v) => v.srs_state === 2 && v.srs_interval >= 21).length;
    const learning = all.length - mastered;
    const chunks = DataStore.getAll("chunkItems").length;
    return `
      <div class="card">
        <h3>複習清單總覽</h3>
        <div class="stat-row">
          <div class="stat-box"><span class="stat-num">${all.length}</span><span class="stat-label">單字</span></div>
          <div class="stat-box"><span class="stat-num">${chunks}</span><span class="stat-label">語塊</span></div>
          <div class="stat-box"><span class="stat-num">${mastered}</span><span class="stat-label">單字已穩定</span></div>
          <div class="stat-box"><span class="stat-num">${learning}</span><span class="stat-label">單字學習中</span></div>
        </div>
      </div>
    `;
  },

  render() {
    if (this.index >= this.queue.length) {
      this.renderSummary();
      return;
    }
    const entry = this.queue[this.index];
    const kind = entry.kind;
    const item = entry.item;
    let front, backHtml;
    if (kind === "chunk") {
      front = Chunks.reviewFront(item);
      backHtml = `<div class="rc-back">${Chunks.reviewBack(item)}</div>`;
    } else {
      // 先挖空、再整段跳脫,確保情境句(可能源自 AI 輸出或貼上的文章)不會夾帶可執行 HTML
      front = item.source_sentence
        ? escapeHtml(item.source_sentence.replace(new RegExp(escapeRegExp(item.word), "gi"), "____"))
        : "(沒有情境句)";
      backHtml = `
            <div class="rc-back">
              <p class="rc-word">${escapeHtml(item.word)} ${item.phonetic ? `<span class="pos">[${escapeHtml(item.phonetic)}]</span>` : ""}</p>
              <p class="rc-meaning">${escapeHtml(item.definition)}</p>
              ${item.source_sentence ? `<p class="muted">${escapeHtml(item.source_sentence)}</p>` : ""}
            </div>`;
    }

    this.container.innerHTML = `
      <div class="card">
        <div class="progress-line">複習中 ${this.index + 1} / ${this.queue.length}　<span class="rc-kind">${kind === "chunk" ? "語塊卡" : "單字卡"}</span></div>
        <div class="review-card">
          <p class="rc-sentence">${front}</p>
          ${this.revealed
            ? `
            ${backHtml}
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
          if (kind === "chunk") {
            FSRS.review(item, grade, { persist: (id, patch) => DataStore.updateChunkItem(id, patch) });
          } else {
            FSRS.review(item, grade);
          }
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
