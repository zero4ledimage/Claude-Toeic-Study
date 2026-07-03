// localStorage 資料存取層 + Leitner box 間隔複習邏輯
// 所有資料皆存在瀏覽器 localStorage,不會上傳到任何伺服器

const STORAGE_KEYS = {
  startDate: "toeic_start_date",
  vocabProgress: "toeic_vocab_progress",
  quizHistory: "toeic_quiz_history",
  wrongAnswers: "toeic_wrong_answers",
  weeklyHours: "toeic_weekly_hours",
  scoreLog: "toeic_score_log"
};

// Leitner box 對應的複習間隔天數
const LEITNER_INTERVALS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 };

const Storage = {
  // ---------- 通用 ----------
  _get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error("Storage read error for", key, e);
      return fallback;
    }
  },
  _set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  // ---------- 開始日期 / 週次計算 ----------
  getStartDate() {
    let d = this._get(STORAGE_KEYS.startDate, null);
    if (!d) {
      d = new Date().toISOString().slice(0, 10);
      this._set(STORAGE_KEYS.startDate, d);
    }
    return d;
  },
  setStartDate(dateStr) {
    this._set(STORAGE_KEYS.startDate, dateStr);
  },
  getCurrentWeek() {
    const start = new Date(this.getStartDate());
    const today = new Date();
    const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;
    return Math.min(Math.max(week, 1), 12);
  },

  // ---------- 單字進度 (Leitner box) ----------
  getVocabProgress() {
    return this._get(STORAGE_KEYS.vocabProgress, {});
  },
  saveVocabProgress(progress) {
    this._set(STORAGE_KEYS.vocabProgress, progress);
  },
  recordVocabAnswer(wordId, correct) {
    const progress = this.getVocabProgress();
    const entry = progress[wordId] || { box: 0, correctCount: 0, incorrectCount: 0, nextReview: null };
    if (correct) {
      entry.box = Math.min((entry.box || 0) + 1, 5);
      entry.correctCount = (entry.correctCount || 0) + 1;
    } else {
      entry.box = 1;
      entry.incorrectCount = (entry.incorrectCount || 0) + 1;
    }
    const interval = LEITNER_INTERVALS[entry.box] || 1;
    const next = new Date();
    next.setDate(next.getDate() + interval);
    entry.nextReview = next.toISOString().slice(0, 10);
    entry.lastSeen = new Date().toISOString().slice(0, 10);
    progress[wordId] = entry;
    this.saveVocabProgress(progress);
  },
  // 取出今天該複習的字 + 新字,湊到 limit 個
  getDueVocabWords(allWords, limit) {
    const progress = this.getVocabProgress();
    const today = new Date().toISOString().slice(0, 10);
    const due = [];
    const fresh = [];
    allWords.forEach((w) => {
      const p = progress[w.id];
      if (!p) {
        fresh.push(w);
      } else if (p.nextReview && p.nextReview <= today) {
        due.push(w);
      }
    });
    due.sort((a, b) => {
      const pa = progress[a.id].nextReview;
      const pb = progress[b.id].nextReview;
      return pa < pb ? -1 : pa > pb ? 1 : 0;
    });
    const combined = due.concat(fresh);
    return combined.slice(0, limit);
  },
  getVocabStats(allWords) {
    const progress = this.getVocabProgress();
    let mastered = 0, learning = 0, untouched = 0;
    allWords.forEach((w) => {
      const p = progress[w.id];
      if (!p) untouched++;
      else if (p.box >= 5) mastered++;
      else learning++;
    });
    return { mastered, learning, untouched, total: allWords.length };
  },

  // ---------- 測驗歷史 ----------
  getQuizHistory() {
    return this._get(STORAGE_KEYS.quizHistory, []);
  },
  addQuizResult(entry) {
    const history = this.getQuizHistory();
    entry.id = Date.now();
    entry.date = new Date().toISOString().slice(0, 10);
    entry.week = this.getCurrentWeek();
    history.push(entry);
    this._set(STORAGE_KEYS.quizHistory, history);
    return entry;
  },

  // ---------- 錯題本 ----------
  getWrongAnswers() {
    return this._get(STORAGE_KEYS.wrongAnswers, []);
  },
  addWrongAnswer(entry) {
    const list = this.getWrongAnswers();
    entry.id = Date.now() + Math.random();
    entry.date = new Date().toISOString().slice(0, 10);
    list.push(entry);
    this._set(STORAGE_KEYS.wrongAnswers, list);
  },
  clearWrongAnswers() {
    this._set(STORAGE_KEYS.wrongAnswers, []);
  },
  getWeaknessStats() {
    const list = this.getWrongAnswers();
    const stats = {};
    list.forEach((item) => {
      const key = item.category || item.type || "other";
      stats[key] = (stats[key] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  },

  // ---------- 每週學習時數 ----------
  getWeeklyHours() {
    return this._get(STORAGE_KEYS.weeklyHours, []);
  },
  addHourLog(hours, note) {
    const list = this.getWeeklyHours();
    list.push({
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      week: this.getCurrentWeek(),
      hours: Number(hours),
      note: note || ""
    });
    this._set(STORAGE_KEYS.weeklyHours, list);
  },
  getHoursForWeek(week) {
    return this.getWeeklyHours()
      .filter((e) => e.week === week)
      .reduce((sum, e) => sum + e.hours, 0);
  },

  // ---------- 990 分制模考成績紀錄(官方或自我估算) ----------
  getScoreLog() {
    return this._get(STORAGE_KEYS.scoreLog, []);
  },
  addScoreLog(score, label) {
    const list = this.getScoreLog();
    list.push({
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      week: this.getCurrentWeek(),
      score: Number(score),
      label: label || ""
    });
    this._set(STORAGE_KEYS.scoreLog, list);
  }
};
