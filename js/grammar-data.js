// TOEIC Part 5 風格文法選擇題題庫 - 60 題,分 6 大文法類別
// answer 為正確選項的 index (0-based)

const GRAMMAR_CATEGORIES = {
  tense: "時態",
  preposition: "介係詞",
  conjunction: "連接詞",
  relative: "關係子句/代名詞",
  wordform: "詞性變化",
  subjectverb: "主詞動詞一致"
};

const GRAMMAR_DATA = [
  // ---------------- tense (時態) ----------------
  { id: 1, category: "tense", sentence: "The company ____ its quarterly earnings report next Monday.", options: ["releases", "will release", "released", "releasing"], answer: 1, explanation: "「next Monday」表示未來時間,須用未來式 will release。" },
  { id: 2, category: "tense", sentence: "By the time the auditors arrive, the accounting team ____ the financial statements.", options: ["will finish", "finishes", "will have finished", "finished"], answer: 2, explanation: "By the time + 未來事件,主要子句須用未來完成式 will have finished。" },
  { id: 3, category: "tense", sentence: "Ms. Chen ____ for the firm for over ten years before she was promoted to director.", options: ["works", "worked", "had worked", "has worked"], answer: 2, explanation: "在過去某動作(被升遷)之前已完成的動作,須用過去完成式 had worked。" },
  { id: 4, category: "tense", sentence: "The new policy ____ into effect as soon as it is approved by the board.", options: ["goes", "went", "will go", "going"], answer: 2, explanation: "主要子句描述未來動作,須用未來式 will go(時間子句 as soon as 用現在式屬正常搭配)。" },
  { id: 5, category: "tense", sentence: "While the technician ____ the printer, several employees complained about the delay.", options: ["repairs", "was repairing", "repaired", "has repaired"], answer: 1, explanation: "while 表示過去進行中的動作背景,須用過去進行式 was repairing。" },
  { id: 6, category: "tense", sentence: "The marketing team ____ a new campaign since the beginning of this month.", options: ["runs", "ran", "has been running", "will run"], answer: 2, explanation: "since + 時間點,強調從過去持續到現在的動作,須用現在完成進行式 has been running。" },
  { id: 7, category: "tense", sentence: "If the shipment ____ on time, we will notify the customer immediately.", options: ["arrives", "arrived", "will arrive", "arriving"], answer: 0, explanation: "第一類條件句,if 子句用現在式 arrives,主要子句才用未來式。" },
  { id: 8, category: "tense", sentence: "The manager ____ the report before she left for her business trip.", options: ["reviews", "review", "had reviewed", "reviewing"], answer: 2, explanation: "在過去動作(left)之前已完成的動作,須用過去完成式 had reviewed。" },
  { id: 9, category: "tense", sentence: "Sales figures ____ steadily since the new product launched.", options: ["increase", "increased", "have increased", "will increase"], answer: 2, explanation: "since 引導的句子,主要子句常用現在完成式 have increased。" },
  { id: 10, category: "tense", sentence: "The board ____ a decision by the end of next week.", options: ["makes", "made", "will have made", "making"], answer: 2, explanation: "by the end of + 未來時間,須用未來完成式 will have made。" },

  // ---------------- preposition (介係詞) ----------------
  { id: 11, category: "preposition", sentence: "The meeting has been scheduled ____ 10 a.m. on Friday.", options: ["in", "on", "at", "for"], answer: 2, explanation: "表示確切時刻用 at,故 at 10 a.m.。" },
  { id: 12, category: "preposition", sentence: "The invoice should be submitted ____ the end of the month.", options: ["by", "at", "on", "in"], answer: 0, explanation: "表示「不遲於」某期限用 by。" },
  { id: 13, category: "preposition", sentence: "The new branch is located ____ the corner of Main Street and Fifth Avenue.", options: ["at", "on", "in", "by"], answer: 0, explanation: "表示位於某個街角的固定用法為 at the corner of。" },
  { id: 14, category: "preposition", sentence: "All employees are required to comply ____ the safety regulations.", options: ["to", "with", "for", "of"], answer: 1, explanation: "comply with 為固定搭配,意思是「遵守」。" },
  { id: 15, category: "preposition", sentence: "The proposal was approved ____ the board of directors.", options: ["by", "with", "from", "at"], answer: 0, explanation: "被動語態中表示動作執行者用 by。" },
  { id: 16, category: "preposition", sentence: "Please distribute the handouts ____ the participants before the session begins.", options: ["among", "between", "to", "with"], answer: 2, explanation: "distribute something to someone 為固定搭配,表示「分發給」。" },
  { id: 17, category: "preposition", sentence: "The conference room is available ____ 2 p.m. and 4 p.m.", options: ["between", "among", "from", "during"], answer: 0, explanation: "between A and B 表示兩個時間點之間。" },
  { id: 18, category: "preposition", sentence: "The company plans to expand its operations ____ Southeast Asia.", options: ["into", "at", "on", "for"], answer: 0, explanation: "expand into + 地區,表示「擴展到」某地。" },
  { id: 19, category: "preposition", sentence: "According ____ the report, sales increased by ten percent.", options: ["with", "to", "for", "at"], answer: 1, explanation: "according to 為固定片語,意思是「根據」。" },
  { id: 20, category: "preposition", sentence: "The workshop will be held ____ the third floor conference room.", options: ["at", "in", "on", "to"], answer: 1, explanation: "表示在某個空間內部用 in。" },

  // ---------------- conjunction (連接詞) ----------------
  { id: 21, category: "conjunction", sentence: "____ the flight was delayed, passengers were given meal vouchers.", options: ["Because", "Despite", "Although", "So"], answer: 0, explanation: "Because 後接完整子句表示原因,說明「因為航班延誤」。" },
  { id: 22, category: "conjunction", sentence: "The report was well received ____ it contained several errors.", options: ["although", "because", "so", "and"], answer: 0, explanation: "although 表示讓步,「儘管報告有幾處錯誤,仍受到好評」。" },
  { id: 23, category: "conjunction", sentence: "You must submit the form ____ you want to receive a refund.", options: ["if", "unless", "although", "but"], answer: 0, explanation: "if 表示條件,「如果你想要退款,就必須繳交表格」。" },
  { id: 24, category: "conjunction", sentence: "The workshop was canceled ____ of low registration.", options: ["because", "because of", "although", "despite"], answer: 1, explanation: "because of + 名詞片語(low registration),表示原因。" },
  { id: 25, category: "conjunction", sentence: "Neither the manager ____ the assistant was available for comment.", options: ["or", "nor", "and", "but"], answer: 1, explanation: "neither...nor... 為固定搭配,表示「兩者都不」。" },
  { id: 26, category: "conjunction", sentence: "The client agreed to the terms, ____ the payment schedule was later revised.", options: ["but", "and", "so", "or"], answer: 0, explanation: "but 表示轉折,「客戶同意條款,但付款時程後來被修改」。" },
  { id: 27, category: "conjunction", sentence: "____ the budget is limited, the team plans to proceed with the project.", options: ["Even though", "Because", "Since", "Unless"], answer: 0, explanation: "Even though 表示讓步,「儘管預算有限,團隊仍計畫進行專案」。" },
  { id: 28, category: "conjunction", sentence: "The report must be revised ____ it can be submitted to the board.", options: ["before", "until", "unless", "so that"], answer: 0, explanation: "before 表示時間先後,「報告必須先修改,才能提交給董事會」。" },
  { id: 29, category: "conjunction", sentence: "She will attend the conference ____ her manager approves the travel request.", options: ["provided that", "despite", "although", "because of"], answer: 0, explanation: "provided that 表示條件,意思是「只要」。" },
  { id: 30, category: "conjunction", sentence: "The company increased its marketing budget ____ boost sales in the coming quarter.", options: ["so that", "in order to", "because", "although"], answer: 1, explanation: "in order to + 原形動詞,表示目的「為了提升銷售」。" },

  // ---------------- relative (關係子句/代名詞) ----------------
  { id: 31, category: "relative", sentence: "The employee ____ résumé impressed the hiring manager was offered the position.", options: ["who", "whom", "whose", "which"], answer: 2, explanation: "空格後接名詞 résumé,須用所有格關係代名詞 whose。" },
  { id: 32, category: "relative", sentence: "This is the report ____ was submitted late last week.", options: ["who", "whose", "which", "whom"], answer: 2, explanation: "先行詞 report 為事物,且作子句主詞,須用 which。" },
  { id: 33, category: "relative", sentence: "The client, ____ has worked with our firm for years, requested a new contract.", options: ["who", "which", "whose", "whom"], answer: 0, explanation: "先行詞 client 為人,且在子句中作主詞,須用 who。" },
  { id: 34, category: "relative", sentence: "The building ____ the company is located was renovated last year.", options: ["which", "where", "who", "whose"], answer: 1, explanation: "先行詞 building 表地點,子句中作地方副詞用途,須用 where。" },
  { id: 35, category: "relative", sentence: "Employees ____ complete the training will receive a certificate.", options: ["who", "whom", "which", "whose"], answer: 0, explanation: "先行詞 employees 為人,且在子句中作主詞,須用 who。" },
  { id: 36, category: "relative", sentence: "The proposal, ____ details were discussed at the meeting, was later approved.", options: ["who", "whose", "which", "whom"], answer: 1, explanation: "空格後接名詞 details,須用所有格關係代名詞 whose。" },
  { id: 37, category: "relative", sentence: "The vendor from ____ we purchased the equipment offers a two-year warranty.", options: ["who", "whom", "which", "whose"], answer: 1, explanation: "介系詞 from 之後須接受格關係代名詞 whom(先行詞為人)。" },
  { id: 38, category: "relative", sentence: "The reason ____ the shipment was delayed remains unclear.", options: ["why", "which", "who", "whom"], answer: 0, explanation: "先行詞 reason 搭配關係副詞 why,表示原因。" },
  { id: 39, category: "relative", sentence: "The candidate ____ we interviewed yesterday has excellent qualifications.", options: ["who", "whom", "whose", "which"], answer: 1, explanation: "先行詞 candidate 為人,且在子句中作受詞(interviewed 的受詞),正式用法須用 whom。" },
  { id: 40, category: "relative", sentence: "This is the department ____ handles all customer complaints.", options: ["which", "where", "whom", "whose"], answer: 0, explanation: "先行詞 department 為事物,且在子句中作主詞,須用 which。" },

  // ---------------- wordform (詞性變化) ----------------
  { id: 41, category: "wordform", sentence: "The company's ____ in the new market has been very successful.", options: ["expand", "expansion", "expanding", "expansive"], answer: 1, explanation: "空格前有所有格 company's,需要名詞 expansion。" },
  { id: 42, category: "wordform", sentence: "Please provide a ____ description of the issue you encountered.", options: ["detail", "detailed", "detailing", "details"], answer: 1, explanation: "空格修飾名詞 description,須用形容詞 detailed。" },
  { id: 43, category: "wordform", sentence: "The manager spoke ____ about the upcoming changes.", options: ["confident", "confidence", "confidently", "confiding"], answer: 2, explanation: "空格修飾動詞 spoke,須用副詞 confidently。" },
  { id: 44, category: "wordform", sentence: "The company offers a ____ range of financial services.", options: ["variety", "various", "vary", "variously"], answer: 1, explanation: "空格修飾名詞 range,須用形容詞 various。" },
  { id: 45, category: "wordform", sentence: "The proposal was rejected due to ____ funding.", options: ["insufficient", "insufficiently", "insufficiency", "insufficiencies"], answer: 0, explanation: "空格修飾名詞 funding,須用形容詞 insufficient。" },
  { id: 46, category: "wordform", sentence: "Her ____ to the project was greatly appreciated by the team.", options: ["contribute", "contribution", "contributing", "contributive"], answer: 1, explanation: "空格作句子主詞,須用名詞 contribution。" },
  { id: 47, category: "wordform", sentence: "The new employee adapted ____ to the company culture.", options: ["quick", "quickly", "quickness", "quicker"], answer: 1, explanation: "空格修飾動詞 adapted,須用副詞 quickly。" },
  { id: 48, category: "wordform", sentence: "The board made a ____ decision to invest in new technology.", options: ["strategy", "strategic", "strategically", "strategize"], answer: 1, explanation: "空格修飾名詞 decision,須用形容詞 strategic。" },
  { id: 49, category: "wordform", sentence: "The department needs a more ____ approach to handling complaints.", options: ["effective", "effectively", "effectiveness", "effect"], answer: 0, explanation: "空格修飾名詞 approach,須用形容詞 effective。" },
  { id: 50, category: "wordform", sentence: "The ____ of the new system took several months to complete.", options: ["implement", "implementation", "implementing", "implemented"], answer: 1, explanation: "空格作句子主詞,須用名詞 implementation。" },

  // ---------------- subjectverb (主詞動詞一致) ----------------
  { id: 51, category: "subjectverb", sentence: "Each of the applicants ____ required to submit a résumé.", options: ["is", "are", "were", "have"], answer: 0, explanation: "Each of + 複數名詞,主詞視為單數,動詞用 is。" },
  { id: 52, category: "subjectverb", sentence: "The list of items ____ posted on the bulletin board.", options: ["was", "were", "have been", "are"], answer: 0, explanation: "主詞為單數 list,動詞須用單數 was。" },
  { id: 53, category: "subjectverb", sentence: "Neither the manager nor the employees ____ aware of the change.", options: ["is", "was", "were", "has"], answer: 2, explanation: "neither...nor... 動詞需與最接近的主詞 employees(複數)一致,故用 were。" },
  { id: 54, category: "subjectverb", sentence: "The number of complaints ____ decreased significantly this year.", options: ["has", "have", "were", "are"], answer: 0, explanation: "The number of + 複數名詞,視為單數主詞,動詞用 has。" },
  { id: 55, category: "subjectverb", sentence: "A number of employees ____ requested additional training.", options: ["has", "have", "is", "was"], answer: 1, explanation: "A number of + 複數名詞,視為複數主詞,動詞用 have。" },
  { id: 56, category: "subjectverb", sentence: "The committee ____ meeting every Thursday to review proposals.", options: ["is", "are", "have", "were"], answer: 0, explanation: "committee 作為一個整體單位時視為單數,動詞用 is。" },
  { id: 57, category: "subjectverb", sentence: "All of the equipment ____ inspected before use.", options: ["is", "are", "were", "have been"], answer: 0, explanation: "equipment 為不可數名詞,視為單數,動詞用 is。" },
  { id: 58, category: "subjectverb", sentence: "The staff ____ divided on the issue of remote work.", options: ["is", "are", "was", "has"], answer: 1, explanation: "此處 staff 指多位員工個別意見不同,視為複數,動詞用 are。" },
  { id: 59, category: "subjectverb", sentence: "Either the supervisor or the team members ____ responsible for submitting the report.", options: ["is", "are", "was", "being"], answer: 1, explanation: "either...or... 動詞需與最接近的主詞 team members(複數)一致,故用 are。" },
  { id: 60, category: "subjectverb", sentence: "The data ____ that customer satisfaction has improved.", options: ["shows", "show", "showing", "shown"], answer: 1, explanation: "data 在正式文法中視為複數名詞(datum 的複數形),動詞用 show。" }
];
