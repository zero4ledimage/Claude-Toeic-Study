# 開發進度(2026-07-14 更新)

## Phase 1 功能完成狀態

| # | 功能(需求文件章節) | 狀態 | 對應檔案 |
|---|---|---|---|
| 1 | 閱讀/聽力素材拆解器(3.2) | ✅ 完成 | `js/decomposer.js` |
| 2 | FSRS 間隔重複引擎(3.1) | ✅ 完成 | `js/fsrs.js` |
| 3 | 單字互動查詢+每日快速複習(3.7) | ✅ 完成 | `js/vocab-lookup.js`、`js/vocab-review.js`、`data/dictionary/dict-subset.json` |
| 4 | 錯題本(3.5) | ✅ 完成 | `js/error-log.js` |
| 5 | 進度追蹤儀表板(3.6 五項功能) | ✅ 完成 | `js/dashboard.js` |
| 6 | 情境化學習排程建議(3.8) | ✅ 完成 | `js/scheduler.js` |
| 7 | API 預算控管與開銷視覺化(3.9) | ✅ 完成 | `worker/src/index.js`(記錄與門檻)、`js/dashboard.js`(視覺化) |
| 8 | 寫作批改沙盒/口說模組輕量版(3.3/3.4) | ✅ 完成 | `js/writing-sandbox.js`、`js/speaking.js` |
| 9 | 多益模擬考排程(2.4/3.6) | ✅ 完成 | `js/mock-schedule.js` |
| 10 | 測驗練習模組・邊測邊學(3.10) | ✅ 完成 | `js/practice.js`、`js/practice-bank.js` |
| 11 | 語塊與搭配詞強化學習(3.11) | ✅ 完成 | `js/chunks.js`、`js/word-tier.js`,擴充 `js/vocab-lookup.js`/`js/vocab-review.js`/`js/writing-sandbox.js`;`chunk_items` 已入 `js/data-store.js`、`js/drive-sync.js` |

## 基礎架構

| 項目 | 狀態 | 備註 |
|---|---|---|
| Cloudflare Worker 中介層(4.1.1) | ✅ 程式碼完成 | **等待使用者依 `docs/DEPLOYMENT.md` Part 1 部署**。額外加了 Google token 驗證的存取控管(spec 未明文,防 Worker 網址外流後預算被盜用) |
| Google Drive 串接(4.2) | ✅ 程式碼完成 | **等待使用者依 Part 2 建立 OAuth Client** |
| GitHub Pages | ⏳ 未啟用 | 使用者依 Part 3 操作 |
| 資料模型(4.5) | ✅ 完成 | `js/data-store.js`,localStorage 快取 + Drive 同步(最後寫入為準) |
| ECDICT→KK 字典管線 | ✅ 完成 | `scripts/convert-ecdict.js`,21,666 字,釋義已轉台灣正體(OpenCC cn→twp) |

## 已知限制(有意的取捨,已寫在對應程式碼註解裡)

- **KK 音標轉換**:ECDICT 音標是英式且記法不一致,規則式轉換無法百分之百精準。已處理字尾兒化、BATH/TRAP 分流、NEAR/SQUARE/CURE 雙母音;**非重音非字尾的 r 化母音**(如 perceive 第一音節、order/market 的字中 r)無法靠規則補回,維持無 r 版本。
- **FSRS 參數**:核心數學模型(stability/difficulty/retrievability 冪律遺忘曲線)完整實作,但初始權重是合理預設值,非 Anki 官方機器學習優化後的數字。
- **詞彙分級(3.11 功能一)**:Oxford 3000/5000 官方 CSV 尚未匯入,`js/word-tier.js` 先內建一份高頻核心字集合作近似,涵蓋率有限;把 Oxford 清單放進 `data/open-content/` 再改由檔案載入即可提升準確度,`classify()` 介面不變。
- **測驗練習估分(3.10)**:本地原創題庫未經官方難度校準,週末模考的分數是粗略換算,已於 UI 與儀表板明確標示「非官方分數」,真正校準仍需官方紙本模擬考。
- **口說模組**:STT+LLM 只能評內容組織,評不了發音/流利度(需求文件 3.4 已載明)。
- **官方題庫**:版權限制不可匯入,錯題採手動謄寫(2.3)。

## 下一步(需使用者操作)

1. 依 `docs/DEPLOYMENT.md` Part 1-3 完成 Cloudflare / Google Cloud / GitHub Pages 設定
2. 把 Worker 網址與 Google OAuth Client ID 回報給 Claude Code,填入 `js/config.js`
3. (可選)在 Anthropic Console 設 USD 35 帳單上限作最終防線

## 未做(Phase 2,依 CLAUDE.md 指示明確不做)

- 寫作批改 Task 1/Task 2 分流精緻評分
- 口說完整 AI 評語邏輯(流暢度、詞彙多樣性維度)
- 雅思模擬考排程
