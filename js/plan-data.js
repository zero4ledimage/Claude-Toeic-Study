// 12 週多益 750 讀書計畫資料(對應與使用者討論後訂定的計畫)

const PLAN_PHASES = [
  { id: 1, name: "Phase 1・基礎打底", weeks: [1, 2, 3], checkpoint: { week: 3, targetScore: 560, label: "約 550-570 分" } },
  { id: 2, name: "Phase 2・分項強化", weeks: [4, 5, 6, 7], checkpoint: { week: 7, targetScore: 640, label: "約 630-650 分" } },
  { id: 3, name: "Phase 3・整合模考", weeks: [8, 9, 10], checkpoint: { week: 10, targetScore: 700, label: "約 690-710 分" } },
  { id: 4, name: "Phase 4・考前衝刺", weeks: [11, 12], checkpoint: { week: 12, targetScore: 720, label: "目標 700-750+ 分" } }
];

const PLAN_WEEKS = [
  { week: 1, phase: 1, title: "核心單字啟動 + 文法基礎", focus: ["每天學習 30-40 個高頻商業單字(辦公室、會議主題)", "複習 Part5 必考文法:時態、介係詞", "開始每天精聽/跟讀習慣", "S&W:背熟口說 Q1-2 朗讀、Q11 意見題模板" ], targetHours: 12 },
  { week: 2, phase: 1, title: "單字擴充 + Part1-2 聽力", focus: ["持續單字學習(人資、行銷主題)", "文法:連接詞、關係子句", "聽力 Part1-2(照片描述、簡答)拿高正確率", "S&W:寫作 Q1 看圖造句練習" ], targetHours: 12 },
  { week: 3, phase: 1, title: "Phase 1 檢核:第一次全真模考", focus: ["單字複習(差旅主題)+ 前兩週單字總複習", "文法:詞性變化、主詞動詞一致", "閱讀 Part7 定位資訊技巧練習", "本週做一次全真模考,對照 checkpoint" ], targetHours: 13 },
  { week: 4, phase: 2, title: "聽力 Part3-4 加強", focus: ["Part3-4(對話/簡短獨白)筆記技巧練習", "文法錯題本複習", "閱讀 Part6 文意選填練習", "S&W:口說 Q3-4 看圖敘述固定練習" ], targetHours: 13 },
  { week: 5, phase: 2, title: "閱讀速度訓練", focus: ["Part7 雙篇閱讀交叉比對訓練", "單字加入間隔複習,鞏固前 4 週單字", "聽力預讀選項習慣養成", "S&W:寫作 Q6-7 email 回覆練習" ], targetHours: 13 },
  { week: 6, phase: 2, title: "計時作答訓練", focus: ["Part5-7 開始計時做題,抓時間感", "半回模考(約 1 小時)檢驗進度", "文法弱點類別加強", "S&W:口說 Q5-7 回答問題固定練習" ], targetHours: 13 },
  { week: 7, phase: 2, title: "Phase 2 檢核:模考 + 錯題分析", focus: ["半回模考,對照 checkpoint 目標", "錯題分類:單字/文法/聽漏/時間不夠", "針對最弱 Part 加強練習", "S&W:計時練習一次完整口說+寫作" ], targetHours: 14 },
  { week: 8, phase: 3, title: "全真模考 Week 1", focus: ["嚴格計時的全真模考(2 小時)", "深度錯題檢討,標記弱點類別", "S&W 全真模考(口說 20 分鐘、寫作 60 分鐘)" ], targetHours: 14 },
  { week: 9, phase: 3, title: "弱點補強", focus: ["針對上週模考最弱的 2-3 個 Part 密集訓練", "單字/文法錯題本複習", "閱讀速度與時間分配調整" ], targetHours: 14 },
  { week: 10, phase: 3, title: "Phase 3 檢核:全真模考 Week 2", focus: ["第二次全真模考,對照 checkpoint 700 分", "S&W 模考微調(內容完整度、文法、連貫性)", "錯題本總複習" ], targetHours: 14 },
  { week: 11, phase: 4, title: "考場節奏訓練", focus: ["全真模考,練習棄題策略與時間分配", "錯題本總複習,不學新內容", "S&W 流暢度加強" ], targetHours: 12 },
  { week: 12, phase: 4, title: "Phase 4 檢核:最終模考 + 考前收尾", focus: ["最後一次全真模考,確認達標情況", "錯題本最終複習", "考前 3-4 天降低強度,調整作息" ], targetHours: 10 }
];
