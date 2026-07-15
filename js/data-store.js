/**
 * 資料模型與存取層(需求文件 4.5 節)
 *
 * 五個資料表:vocab_items / error_log / progress_records / study_sessions / api_usage_daily
 *
 * 儲存策略:
 *  - 每次寫入先落地到 localStorage(立即生效、離線可用、跨分頁同步快)
 *  - 同時標記為「待同步」,由 DriveSync 模組(js/drive-sync.js)以 debounce 方式
 *    整份收藏(collection)寫回 Google Drive 的 JSON 檔案
 *  - App 啟動時,先讀 localStorage 讓畫面立刻可用,再非同步跟 Drive 對一次,
 *    以「哪一份 updated_at 較新」整份覆蓋較舊的一份(單一使用者、非即時多裝置併發編輯,
 *    採最後寫入為準,不做逐筆合併,細節見 docs/DATA_SYNC.md)
 *
 * vocab_items 的 srs_* 欄位除了需求文件草案列出的 srs_due_date、srs_interval,
 * 另外補上 FSRS 演算法(js/fsrs.js)實際運作需要的內部狀態欄位
 * (srs_stability / srs_difficulty / srs_reps / srs_lapses / srs_state / srs_last_review)。
 * 這是需求文件 4.5 節本身註明「草案,待細化」下的合理擴充,不是偏離規格。
 */

const COLLECTIONS = ["vocabItems", "errorLog", "progressRecords", "studySessions", "apiUsageDailyCache", "chunkItems", "generatedItems", "sourceTexts"];

const STORAGE_PREFIX = "tls_"; // toeic-ielts-study

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function nowIso() {
  return new Date().toISOString();
}

const listeners = {};
function on(event, fn) {
  (listeners[event] = listeners[event] || []).push(fn);
}
function emit(event, payload) {
  (listeners[event] || []).forEach((fn) => fn(payload));
}

const state = {
  vocabItems: [],
  errorLog: [],
  progressRecords: [],
  studySessions: [],
  apiUsageDailyCache: [],
  chunkItems: [],
  generatedItems: [],
  sourceTexts: [],
  meta: {
    // 每個 collection 各自的最後更新時間,DriveSync 用來判斷本地/雲端哪份較新
    updatedAt: { vocabItems: null, errorLog: null, progressRecords: null, studySessions: null, apiUsageDailyCache: null, chunkItems: null, generatedItems: null, sourceTexts: null }
  }
};

function loadFromLocalStorage() {
  COLLECTIONS.forEach((col) => {
    const raw = localStorage.getItem(STORAGE_PREFIX + col);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        state[col] = parsed.items || [];
        state.meta.updatedAt[col] = parsed.updatedAt || null;
      } catch (e) {
        console.error("Failed to parse local data for", col, e);
      }
    }
  });
}

function persistToLocalStorage(col) {
  localStorage.setItem(
    STORAGE_PREFIX + col,
    JSON.stringify({ items: state[col], updatedAt: state.meta.updatedAt[col] })
  );
}

function touch(col) {
  state.meta.updatedAt[col] = nowIso();
  persistToLocalStorage(col);
  emit(col + ":changed", state[col]);
  emit("data:dirty", { collection: col });
}

const DataStore = {
  COLLECTIONS,
  on,

  init() {
    loadFromLocalStorage();
    emit("data:loaded", null);
  },

  // ---------- 通用讀取 ----------
  getAll(col) {
    return state[col].slice();
  },
  getUpdatedAt(col) {
    return state.meta.updatedAt[col];
  },

  // ---------- Drive 同步用的底層存取(整份覆蓋) ----------
  _replaceCollection(col, items, updatedAt) {
    state[col] = items || [];
    state.meta.updatedAt[col] = updatedAt || nowIso();
    persistToLocalStorage(col);
    emit(col + ":changed", state[col]);
  },
  _snapshotForSync(col) {
    return { items: state[col], updatedAt: state.meta.updatedAt[col] };
  },

  // ---------- vocab_items ----------
  addVocabItem({ word, phonetic, definition, source_sentence, source_type, ai_context_note, source_label }) {
    const existing = state.vocabItems.find((v) => v.word.toLowerCase() === word.toLowerCase());
    if (existing) return existing; // 避免重複加入同一個單字
    const item = {
      id: uid(),
      word,
      phonetic: phonetic || "",
      definition: definition || "",
      source_sentence: source_sentence || "",
      source_type: source_type || "manual", // reading_test / listening_test / manual
      source_label: source_label || null, // 來源影片標題(3.12)
      ai_context_note: ai_context_note || null,
      srs_due_date: nowIso(),
      srs_interval: 0,
      error_count: 0,
      srs_stability: 0,
      srs_difficulty: 0,
      srs_reps: 0,
      srs_lapses: 0,
      srs_state: 0, // 0 New / 1 Learning / 2 Review / 3 Relearning
      srs_last_review: null,
      created_at: nowIso()
    };
    state.vocabItems.push(item);
    touch("vocabItems");
    return item;
  },
  updateVocabItem(id, patch) {
    const item = state.vocabItems.find((v) => v.id === id);
    if (!item) return null;
    Object.assign(item, patch);
    touch("vocabItems");
    return item;
  },
  getDueVocabItems(now = new Date()) {
    return state.vocabItems.filter((v) => new Date(v.srs_due_date) <= now);
  },

  // ---------- error_log ----------
  addErrorLogEntry({ skill_type, error_category, original_content, correction, related_vocab_ids }) {
    const entry = {
      id: uid(),
      date: nowIso().slice(0, 10),
      skill_type, // reading / listening / writing / speaking
      error_category, // vocab / grammar / logic
      original_content: original_content || "",
      correction: correction || "",
      related_vocab_ids: related_vocab_ids || []
    };
    state.errorLog.push(entry);
    touch("errorLog");
    return entry;
  },
  removeErrorLogEntry(id) {
    state.errorLog = state.errorLog.filter((e) => e.id !== id);
    touch("errorLog");
  },
  getWeaknessStats() {
    const stats = {};
    state.errorLog.forEach((e) => {
      const key = `${e.skill_type}・${e.error_category}`;
      stats[key] = (stats[key] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  },

  // ---------- progress_records ----------
  addProgressRecord({ test_type, skill, score, source }) {
    const record = {
      id: uid(),
      date: nowIso().slice(0, 10),
      test_type, // toeic / ielts
      skill, // reading/listening (toeic) or reading/listening/writing/speaking (ielts)
      score,
      source // official_mock / self_practice
    };
    state.progressRecords.push(record);
    touch("progressRecords");
    return record;
  },

  // ---------- study_sessions ----------
  addStudySession({ duration_minutes, time_slot_type, phase, skill_focus }) {
    const session = {
      id: uid(),
      date: nowIso().slice(0, 10),
      duration_minutes,
      time_slot_type, // weekday_fragment / weekday_evening / weekend
      phase: phase || 1,
      skill_focus: skill_focus || ""
    };
    state.studySessions.push(session);
    touch("studySessions");
    return session;
  },
  getStudySessionsForDate(dateStr) {
    return state.studySessions.filter((s) => s.date === dateStr);
  },

  // ---------- chunk_items(語塊/搭配詞,需求文件 3.11 節) ----------
  addChunkItem({ chunk_text, chunk_type, core_word, common_variants, core_image_note, source_sentence, vocab_tier, source_label }) {
    const existing = state.chunkItems.find(
      (c) => c.chunk_text.toLowerCase() === (chunk_text || "").toLowerCase()
    );
    if (existing) return existing; // 避免重複加入同一個語塊
    const item = {
      id: uid(),
      chunk_text: chunk_text || "",
      chunk_type: chunk_type || "collocation", // collocation / phrasal_verb / idiom / sentence_pattern
      core_word: core_word || "",
      common_variants: common_variants || [],
      core_image_note: core_image_note || null,
      source_sentence: source_sentence || "",
      source_label: source_label || null, // 來源影片標題(3.12)
      vocab_tier: vocab_tier || "core_3000",
      srs_due_date: nowIso(),
      srs_interval: 0,
      error_count: 0,
      srs_stability: 0,
      srs_difficulty: 0,
      srs_reps: 0,
      srs_lapses: 0,
      srs_state: 0,
      srs_last_review: null,
      created_at: nowIso()
    };
    state.chunkItems.push(item);
    touch("chunkItems");
    return item;
  },
  updateChunkItem(id, patch) {
    const item = state.chunkItems.find((c) => c.id === id);
    if (!item) return null;
    Object.assign(item, patch);
    touch("chunkItems");
    return item;
  },
  removeChunkItem(id) {
    state.chunkItems = state.chunkItems.filter((c) => c.id !== id);
    touch("chunkItems");
  },
  getDueChunkItems(now = new Date()) {
    return state.chunkItems.filter((c) => new Date(c.srs_due_date) <= now);
  },

  // ---------- generated_items(AI 生成的練習題,需求文件 3.10.3 / 3.12) ----------
  addGeneratedItem({ type, payload, source_label }) {
    const item = { id: uid(), type, payload, source_label: source_label || null, created_at: nowIso() }; // type: grammar / reading
    state.generatedItems.push(item);
    touch("generatedItems");
    return item;
  },
  getGeneratedItems(type, source_label) {
    return state.generatedItems.filter(
      (g) => (!type || g.type === type) && (source_label === undefined || g.source_label === source_label)
    );
  },

  // ---------- source_texts(影片逐字稿原文,需求文件 3.12) ----------
  addSourceText({ source_label, text }) {
    const item = { id: uid(), source_label: source_label || "(未命名)", text: text || "", created_at: nowIso() };
    state.sourceTexts.push(item);
    touch("sourceTexts");
    return item;
  },
  getSourceTexts() {
    return state.sourceTexts.slice();
  },
  removeSourceText(id) {
    state.sourceTexts = state.sourceTexts.filter((s) => s.id !== id);
    touch("sourceTexts");
  },
  removeGeneratedItem(id) {
    state.generatedItems = state.generatedItems.filter((g) => g.id !== id);
    touch("generatedItems");
  },

  // ---------- api_usage_daily(快取 Worker /budget/status 的回傳結果,供離線繪圖) ----------
  cacheApiUsageDaily(dayRecords) {
    state.apiUsageDailyCache = dayRecords;
    touch("apiUsageDailyCache");
  }
};

DataStore.init();
