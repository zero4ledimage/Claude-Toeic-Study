// 錯題本與弱點分析模組

const READING_TYPE_LABELS = {
  "reading-part6": "Part6 短文填空",
  "reading-part7": "Part7 閱讀測驗"
};

function labelForCategory(cat) {
  if (VOCAB_CATEGORIES[cat]) return "單字・" + VOCAB_CATEGORIES[cat];
  if (GRAMMAR_CATEGORIES[cat]) return "文法・" + GRAMMAR_CATEGORIES[cat];
  if (READING_TYPE_LABELS[cat]) return READING_TYPE_LABELS[cat];
  return cat;
}

const Review = {
  mount(container) {
    this.container = container;
    this.render();
  },

  render() {
    const container = this.container;
    const wrongList = Storage.getWrongAnswers().slice().reverse();
    const stats = Storage.getWeaknessStats();
    const maxCount = stats.length ? stats[0].count : 1;

    container.innerHTML = `
      <div class="card">
        <h2>弱點分析</h2>
        ${
          stats.length === 0
            ? `<p class="muted">目前還沒有錯題紀錄,先去做幾題單字測驗或模考吧!</p>`
            : `<div id="weakness-chart" class="chart-area">
                ${stats
                  .map(
                    (s) => `
                  <div class="chart-row">
                    <span class="chart-row-label">${labelForCategory(s.category)}</span>
                    <div class="chart-bar-track"><div class="chart-bar weakness-bar" style="width:${(s.count / maxCount) * 100}%"></div></div>
                    <span class="chart-row-value">${s.count} 次</span>
                  </div>`
                  )
                  .join("")}
              </div>`
        }
      </div>

      <div class="card">
        <div class="flex-between">
          <h2>錯題本</h2>
          <button class="btn-secondary" id="clear-wrong-btn">清空錯題本</button>
        </div>
        ${
          wrongList.length === 0
            ? `<p class="muted">目前沒有錯題紀錄。</p>`
            : `<div class="wrong-answer-list">
                ${wrongList
                  .map(
                    (w) => `
                  <div class="review-item">
                    <p class="review-meta">${w.date} · ${labelForCategory(w.category)}</p>
                    <p class="review-q">${w.question}</p>
                    <p class="review-correct">正確答案:${w.correctAnswer}</p>
                    ${w.userAnswer ? `<p class="review-user">你的答案:${w.userAnswer}</p>` : ""}
                  </div>`
                  )
                  .join("")}
              </div>`
        }
      </div>
    `;

    const clearBtn = container.querySelector("#clear-wrong-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (confirm("確定要清空整個錯題本嗎?此動作無法復原。")) {
          Storage.clearWrongAnswers();
          this.render();
        }
      });
    }
  }
};
