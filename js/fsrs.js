/**
 * FSRS(Free Spaced Repetition Scheduler)間隔重複引擎(需求文件 3.1 節)
 *
 * ⚠️ 誠實聲明:這裡實作的是 FSRS 演算法的核心數學模型——用「穩定度
 * (stability)」、「難度(difficulty)」、「可提取性(retrievability,依冪律
 * 遺忘曲線計算)」三個變數動態計算下次複習時間,而不是固定天數的 Leitner
 * boxes。但下面的初始參數(w0-w16)是社群公開、合理的**起始預設值**,
 * 不是聲稱與 Anki 官方 FSRS 實作逐位元相同——那些官方數字本來就是 Anki
 * 用他們自己數百萬使用者的複習紀錄機器學習優化出來的,對這個工具的使用
 * 情境不一定直接適用。核心價值在於:排程會依你自己每次「記得/不記得」
 * 的實際作答動態調整,而不是不管你答得好壞都照同一套固定天數表複習,這
 * 正是需求文件 1.1 節「45歲記憶力現況,需要間隔重複而非固定排程」的目標。
 *
 * 遺忘曲線公式(冪律,FSRS 的核心設計,而非傳統 SM-2 的指數衰減):
 *   R(t, S) = (1 + t / (9S)) ^ -1
 *   其中 t = 距離上次複習經過的天數,S = 穩定度(天)
 */

const FSRS_WEIGHTS = {
  // 新卡片第一次評分後的初始穩定度(天),依評分 1=忘記/2=困難/3=記得/4=簡單
  initialStability: { 1: 0.4, 2: 0.6, 3: 2.4, 4: 5.8 },
  // 新卡片第一次評分後的初始難度基準與敏感度
  initialDifficultyBase: 5,
  initialDifficultySensitivity: 1,
  // 每次複習後難度的調整敏感度與回歸強度
  difficultyDelta: 0.9,
  difficultyMeanReversion: 0.1,
  difficultyEasyTarget: 3.2,
  // 成功複習(Hard/Good/Easy)穩定度成長公式的係數
  successGrowthScale: 0.9, // 對應 e^w8 的角色,已先取好方便閱讀
  successStabilityDecay: 0.15, // 現有穩定度越高,成長越慢(邊際效應遞減)
  successSurpriseGain: 0.5, // 複習當下 retrievability 越低卻答對,穩定度成長越多
  gradeBonus: { 2: 0.75, 3: 1.0, 4: 1.35 }, // Hard 抑制成長、Easy 加成成長
  // 忘記(Again)時穩定度重置公式的係數
  lapseStabilityScale: 1.6,
  lapseDifficultyDecay: 0.2,
  lapseRecoveryPower: 0.6,
  lapseSurpriseGain: 0.5
};

const DEFAULT_DESIRED_RETENTION = 0.9;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function retrievability(elapsedDays, stability) {
  if (stability <= 0) return 0;
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

function nextIntervalDays(stability, desiredRetention = DEFAULT_DESIRED_RETENTION) {
  return 9 * stability * (1 / desiredRetention - 1);
}

function initialDifficulty(grade) {
  const w = FSRS_WEIGHTS;
  const d = w.initialDifficultyBase - (grade - 3) * w.initialDifficultySensitivity;
  return clamp(d, 1, 10);
}

function updateDifficulty(oldDifficulty, grade) {
  const w = FSRS_WEIGHTS;
  const delta = -(grade - 3) * w.difficultyDelta;
  const raw = oldDifficulty + delta;
  const reverted = w.difficultyMeanReversion * w.difficultyEasyTarget + (1 - w.difficultyMeanReversion) * raw;
  return clamp(reverted, 1, 10);
}

function updateStabilityOnSuccess(oldStability, difficulty, r, grade) {
  const w = FSRS_WEIGHTS;
  const growth =
    w.successGrowthScale *
    (11 - difficulty) *
    Math.pow(oldStability, -w.successStabilityDecay) *
    (Math.exp(w.successSurpriseGain * (1 - r)) - 1);
  const bonus = w.gradeBonus[grade] || 1.0;
  const newStability = oldStability * (1 + growth) * bonus;
  return Math.max(newStability, 0.1);
}

function updateStabilityOnLapse(oldStability, difficulty, r) {
  const w = FSRS_WEIGHTS;
  const newStability =
    w.lapseStabilityScale *
    Math.pow(difficulty, -w.lapseDifficultyDecay) *
    (Math.pow(oldStability + 1, w.lapseRecoveryPower) - 1) *
    Math.exp(w.lapseSurpriseGain * (1 - r));
  return Math.max(newStability, 0.1);
}

const FSRS = {
  GRADE: { AGAIN: 1, HARD: 2, GOOD: 3, EASY: 4 },
  DEFAULT_DESIRED_RETENTION,
  retrievability,
  nextIntervalDays,

  /**
   * 取得某張單字卡「現在」的可提取性(0-1),給 UI 顯示參考用(非必要)
   */
  currentRetrievability(vocabItem, now = new Date()) {
    if (!vocabItem.srs_last_review || !vocabItem.srs_stability) return null;
    const elapsedDays = (now - new Date(vocabItem.srs_last_review)) / (1000 * 60 * 60 * 24);
    return retrievability(Math.max(elapsedDays, 0), vocabItem.srs_stability);
  },

  /**
   * 使用者對這張單字卡評分(1-4,對應忘記/困難/記得/簡單),回傳更新後的 patch,
   * 並直接寫回 DataStore。
   */
  review(vocabItem, grade, options = {}) {
    const now = options.now || new Date();
    const desiredRetention = options.desiredRetention || DEFAULT_DESIRED_RETENTION;
    const isNew = !vocabItem.srs_last_review;

    let difficulty, stability, r;

    if (isNew) {
      difficulty = initialDifficulty(grade);
      stability = FSRS_WEIGHTS.initialStability[grade] || FSRS_WEIGHTS.initialStability[3];
      r = 1; // 新卡片沒有遺忘曲線可言,視為剛學會
    } else {
      const elapsedDays = Math.max((now - new Date(vocabItem.srs_last_review)) / (1000 * 60 * 60 * 24), 0);
      r = retrievability(elapsedDays, vocabItem.srs_stability || 1);
      difficulty = updateDifficulty(vocabItem.srs_difficulty || initialDifficulty(3), grade);
      if (grade === FSRS.GRADE.AGAIN) {
        stability = updateStabilityOnLapse(vocabItem.srs_stability || 1, difficulty, r);
      } else {
        stability = updateStabilityOnSuccess(vocabItem.srs_stability || 1, difficulty, r, grade);
      }
    }

    const intervalDays = nextIntervalDays(stability, desiredRetention);
    const dueDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    const patch = {
      srs_stability: stability,
      srs_difficulty: difficulty,
      srs_reps: (vocabItem.srs_reps || 0) + 1,
      srs_lapses: (vocabItem.srs_lapses || 0) + (grade === FSRS.GRADE.AGAIN ? 1 : 0),
      srs_state: grade === FSRS.GRADE.AGAIN ? 3 : 2, // 3 Relearning / 2 Review
      srs_last_review: now.toISOString(),
      srs_due_date: dueDate.toISOString(),
      srs_interval: Math.round(intervalDays * 10) / 10,
      error_count: vocabItem.error_count + (grade === FSRS.GRADE.AGAIN ? 1 : 0)
    };

    return DataStore.updateVocabItem(vocabItem.id, patch);
  }
};
