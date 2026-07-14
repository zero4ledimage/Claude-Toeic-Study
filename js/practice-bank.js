/**
 * 測驗練習模組的本地原創種子題庫(需求文件 3.10.3 節)
 *
 * 全部為原創題目,不含任何官方版權題(呼應 2.1、2.3 節)。這是「即時、離線、免費」
 * 的基礎題源;後續可依錯題本弱點用 Haiku 4.5 生成更多題目來擴充(見 3.10.3)。
 *
 * 單字題另有一個更個人化的題源:使用者自己存下的 vocab_items(拆解器/滑鼠查詢加入的字),
 * 由 practice.js 優先取用,本檔的 PRACTICE_VOCAB 是新使用者也能立刻開始練的後備字庫。
 */

// ---------------- 單字(商務/多益高頻,依主題) ----------------
const PRACTICE_VOCAB = [
  { word: "colleague", pos: "n.", meaning: "同事", example: "I discussed the plan with my colleague this morning." },
  { word: "deadline", pos: "n.", meaning: "截止日期", example: "The deadline for the proposal is next Friday." },
  { word: "agenda", pos: "n.", meaning: "議程", example: "Please review the agenda before the meeting." },
  { word: "supervisor", pos: "n.", meaning: "主管", example: "Ask your supervisor for approval first." },
  { word: "overtime", pos: "n.", meaning: "加班", example: "Employees who work overtime receive extra pay." },
  { word: "postpone", pos: "v.", meaning: "延後", example: "The meeting has been postponed until next week." },
  { word: "reschedule", pos: "v.", meaning: "重新安排時間", example: "Could we reschedule our appointment to Thursday?" },
  { word: "confirm", pos: "v.", meaning: "確認", example: "Please confirm your attendance by email." },
  { word: "notify", pos: "v.", meaning: "通知", example: "Staff will be notified of any changes in advance." },
  { word: "submit", pos: "v.", meaning: "提交", example: "Please submit your report by the end of the day." },
  { word: "approve", pos: "v.", meaning: "批准", example: "The board approved the budget proposal." },
  { word: "maintenance", pos: "n.", meaning: "維護", example: "The elevator is closed for maintenance." },
  { word: "equipment", pos: "n.", meaning: "設備", example: "New equipment was installed in the lab." },
  { word: "install", pos: "v.", meaning: "安裝", example: "The IT team will install the software this weekend." },
  { word: "policy", pos: "n.", meaning: "政策", example: "The company updated its remote work policy." },
  { word: "regulation", pos: "n.", meaning: "規定", example: "All employees must comply with safety regulations." },
  { word: "confidential", pos: "adj.", meaning: "機密的", example: "This document contains confidential information." },
  { word: "authorize", pos: "v.", meaning: "授權", example: "Only the manager can authorize this purchase." },
  { word: "procedure", pos: "n.", meaning: "程序", example: "Follow the standard procedure when filing expenses." },
  { word: "relocate", pos: "v.", meaning: "搬遷", example: "The company will relocate its headquarters next spring." },

  { word: "conference", pos: "n.", meaning: "會議", example: "The annual conference will be held in Taipei." },
  { word: "presentation", pos: "n.", meaning: "簡報", example: "She gave an excellent presentation on the strategy." },
  { word: "participant", pos: "n.", meaning: "參與者", example: "Each participant will receive a certificate." },
  { word: "venue", pos: "n.", meaning: "場地", example: "The venue has been changed to the downtown hotel." },
  { word: "proposal", pos: "n.", meaning: "提案", example: "The team submitted a proposal for the new product." },
  { word: "feedback", pos: "n.", meaning: "回饋", example: "We appreciate your feedback on the presentation." },
  { word: "objective", pos: "n.", meaning: "目標", example: "The main objective is to finalize the budget." },
  { word: "clarify", pos: "v.", meaning: "澄清", example: "Could you clarify what you meant by that?" },
  { word: "highlight", pos: "v.", meaning: "強調", example: "The report highlights several areas for improvement." },
  { word: "consensus", pos: "n.", meaning: "共識", example: "The board reached a consensus on the merger." },

  { word: "candidate", pos: "n.", meaning: "應徵者", example: "We interviewed five candidates for the position." },
  { word: "vacancy", pos: "n.", meaning: "職缺", example: "There is a vacancy in the accounting department." },
  { word: "recruit", pos: "v.", meaning: "招募", example: "The company plans to recruit ten new engineers." },
  { word: "qualification", pos: "n.", meaning: "資格", example: "The job requires a professional qualification." },
  { word: "benefits", pos: "n.", meaning: "福利", example: "The position offers a competitive salary and benefits." },
  { word: "promotion", pos: "n.", meaning: "升遷", example: "She was offered a promotion after two years." },
  { word: "resign", pos: "v.", meaning: "辭職", example: "He decided to resign from his position." },
  { word: "eligible", pos: "adj.", meaning: "符合資格的", example: "Only full-time employees are eligible for this benefit." },
  { word: "supervise", pos: "v.", meaning: "監督", example: "She supervises a team of ten representatives." },
  { word: "personnel", pos: "n.", meaning: "人事", example: "Contact the personnel department for details." },

  { word: "advertisement", pos: "n.", meaning: "廣告", example: "The company placed an advertisement in the paper." },
  { word: "campaign", pos: "n.", meaning: "行銷活動", example: "The campaign increased sales by twenty percent." },
  { word: "consumer", pos: "n.", meaning: "消費者", example: "Consumer demand for eco products is increasing." },
  { word: "retail", pos: "n.", meaning: "零售", example: "The retail price is higher than the wholesale price." },
  { word: "merchandise", pos: "n.", meaning: "商品", example: "All summer merchandise is now on sale." },
  { word: "launch", pos: "v.", meaning: "推出", example: "The company will launch its new product next month." },
  { word: "discount", pos: "n.", meaning: "折扣", example: "Customers can get a 20 percent discount this weekend." },
  { word: "warranty", pos: "n.", meaning: "保固", example: "The product comes with a one-year warranty." },
  { word: "defective", pos: "adj.", meaning: "有瑕疵的", example: "Customers can return defective items for a refund." },
  { word: "competitor", pos: "n.", meaning: "競爭對手", example: "Our main competitor released a similar product." },
  { word: "revenue", pos: "n.", meaning: "營收", example: "Annual revenue increased by fifteen percent." },
  { word: "profit", pos: "n.", meaning: "利潤", example: "The firm reported a record profit this year." },
  { word: "forecast", pos: "n.", meaning: "預測", example: "Analysts forecast steady growth next quarter." },
  { word: "supplier", pos: "n.", meaning: "供應商", example: "We changed suppliers to reduce costs." },
  { word: "invoice", pos: "n.", meaning: "發票/請款單", example: "Please pay the invoice within thirty days." },
  { word: "negotiate", pos: "v.", meaning: "協商", example: "They negotiated the contract for several weeks." },

  { word: "itinerary", pos: "n.", meaning: "行程表", example: "Please review your travel itinerary before departure." },
  { word: "reservation", pos: "n.", meaning: "預訂", example: "I would like to make a reservation for two nights." },
  { word: "accommodation", pos: "n.", meaning: "住宿", example: "The company will arrange accommodation for guests." },
  { word: "departure", pos: "n.", meaning: "出發", example: "The departure time has been changed to 9 a.m." },
  { word: "luggage", pos: "n.", meaning: "行李", example: "Please make sure your luggage meets the weight limit." },
  { word: "delay", pos: "n.", meaning: "延誤", example: "The flight was delayed due to bad weather." },
  { word: "refund", pos: "n.", meaning: "退款", example: "You may request a refund if the flight is canceled." },
  { word: "reimbursement", pos: "n.", meaning: "報銷", example: "Submit your receipts for reimbursement within two weeks." },
  { word: "amenities", pos: "n.", meaning: "設施", example: "The hotel offers amenities such as a pool and gym." },
  { word: "destination", pos: "n.", meaning: "目的地", example: "Paris is a popular destination for business travelers." },

  { word: "efficient", pos: "adj.", meaning: "有效率的", example: "The new system is more efficient than the old one." },
  { word: "reliable", pos: "adj.", meaning: "可靠的", example: "We need a reliable supplier for this project." },
  { word: "significant", pos: "adj.", meaning: "顯著的", example: "There was a significant increase in sales." },
  { word: "temporary", pos: "adj.", meaning: "暫時的", example: "This is only a temporary solution." },
  { word: "additional", pos: "adj.", meaning: "額外的", example: "There is an additional charge for delivery." },
  { word: "estimate", pos: "v.", meaning: "估計", example: "We estimate the project will take three months." },
  { word: "expand", pos: "v.", meaning: "擴展", example: "The company plans to expand into Southeast Asia." },
  { word: "implement", pos: "v.", meaning: "實施", example: "The new policy will be implemented next month." },
  { word: "purchase", pos: "v.", meaning: "購買", example: "You can purchase tickets online." },
  { word: "recommend", pos: "v.", meaning: "推薦", example: "I would recommend booking in advance." },
  { word: "require", pos: "v.", meaning: "需要/要求", example: "This position requires two years of experience." },
  { word: "provide", pos: "v.", meaning: "提供", example: "The hotel provides a complimentary breakfast." },
  { word: "attend", pos: "v.", meaning: "出席", example: "All managers are required to attend the briefing." },
  { word: "assign", pos: "v.", meaning: "指派", example: "The manager assigned the task to a junior staff member." },
  { word: "complete", pos: "v.", meaning: "完成", example: "Please complete the form before you leave." },
  { word: "increase", pos: "v.", meaning: "增加", example: "Sales increased steadily over the quarter." }
];

// ---------------- 文法(Part 5 風格) ----------------
const PRACTICE_GRAMMAR = [
  { category: "tense", sentence: "The company ____ its earnings report next Monday.", options: ["releases", "will release", "released", "releasing"], answer: 1, explanation: "「next Monday」是未來時間,須用未來式 will release。" },
  { category: "tense", sentence: "By the time the auditors arrive, the team ____ the statements.", options: ["will finish", "finishes", "will have finished", "finished"], answer: 2, explanation: "By the time + 未來事件,主要子句用未來完成式 will have finished。" },
  { category: "tense", sentence: "Sales ____ steadily since the new product launched.", options: ["increase", "increased", "have increased", "will increase"], answer: 2, explanation: "since + 過去時間點,常搭配現在完成式 have increased。" },
  { category: "tense", sentence: "While the technician ____ the printer, staff complained about the delay.", options: ["repairs", "was repairing", "repaired", "has repaired"], answer: 1, explanation: "while 表示過去進行中的背景動作,用過去進行式 was repairing。" },
  { category: "tense", sentence: "If the shipment ____ on time, we will notify the customer.", options: ["arrives", "arrived", "will arrive", "arriving"], answer: 0, explanation: "條件句 if 子句用現在式 arrives,主要子句才用未來式。" },
  { category: "preposition", sentence: "The meeting is scheduled ____ 10 a.m. on Friday.", options: ["in", "on", "at", "for"], answer: 2, explanation: "確切時刻用 at,故 at 10 a.m.。" },
  { category: "preposition", sentence: "The invoice should be submitted ____ the end of the month.", options: ["by", "at", "on", "in"], answer: 0, explanation: "表示「不遲於」某期限用 by。" },
  { category: "preposition", sentence: "All employees must comply ____ the safety regulations.", options: ["to", "with", "for", "of"], answer: 1, explanation: "comply with 為固定搭配,意為「遵守」。" },
  { category: "preposition", sentence: "The proposal was approved ____ the board of directors.", options: ["by", "with", "from", "at"], answer: 0, explanation: "被動語態中,動作執行者用 by。" },
  { category: "preposition", sentence: "According ____ the report, sales rose ten percent.", options: ["with", "to", "for", "at"], answer: 1, explanation: "according to 為固定片語,意為「根據」。" },
  { category: "conjunction", sentence: "____ the flight was delayed, passengers received vouchers.", options: ["Because", "Despite", "Although", "So"], answer: 0, explanation: "Because 後接完整子句表示原因。" },
  { category: "conjunction", sentence: "The report was well received ____ it contained several errors.", options: ["although", "because", "so", "and"], answer: 0, explanation: "although 表示讓步,「儘管有錯,仍受好評」。" },
  { category: "conjunction", sentence: "The workshop was canceled ____ low registration.", options: ["because", "because of", "although", "despite"], answer: 1, explanation: "because of + 名詞片語(low registration)表示原因;because/although 後面要接完整子句,不能直接接名詞片語。" },
  { category: "conjunction", sentence: "Neither the manager ____ the assistant was available.", options: ["or", "nor", "and", "but"], answer: 1, explanation: "neither...nor... 為固定搭配。" },
  { category: "conjunction", sentence: "The company raised its budget ____ boost sales this quarter.", options: ["so that", "in order to", "because", "although"], answer: 1, explanation: "in order to + 原形動詞,表示目的。" },
  { category: "relative", sentence: "The employee ____ résumé impressed the manager was hired.", options: ["who", "whom", "whose", "which"], answer: 2, explanation: "空格後接名詞 résumé,用所有格關係代名詞 whose。" },
  { category: "relative", sentence: "This is the report ____ was submitted late last week.", options: ["who", "whose", "which", "whom"], answer: 2, explanation: "先行詞 report 為事物且作子句主詞,用 which。" },
  { category: "relative", sentence: "Employees ____ complete the training will get a certificate.", options: ["who", "whom", "which", "whose"], answer: 0, explanation: "先行詞 employees 為人且作子句主詞,用 who。" },
  { category: "relative", sentence: "The building ____ the company is located was renovated.", options: ["which", "where", "who", "whose"], answer: 1, explanation: "先行詞 building 表地點,用關係副詞 where。" },
  { category: "relative", sentence: "The candidate ____ we interviewed has excellent skills.", options: ["who", "whom", "whose", "which"], answer: 1, explanation: "先行詞為人且在子句中作受詞,正式用法用 whom。" },
  { category: "wordform", sentence: "The company's ____ into the new market was successful.", options: ["expand", "expansion", "expanding", "expansive"], answer: 1, explanation: "所有格 company's 後需要名詞 expansion。" },
  { category: "wordform", sentence: "Please provide a ____ description of the issue.", options: ["detail", "detailed", "detailing", "details"], answer: 1, explanation: "修飾名詞 description,用形容詞 detailed。" },
  { category: "wordform", sentence: "The manager spoke ____ about the upcoming changes.", options: ["confident", "confidence", "confidently", "confiding"], answer: 2, explanation: "修飾動詞 spoke,用副詞 confidently。" },
  { category: "wordform", sentence: "The proposal was rejected due to ____ funding.", options: ["insufficient", "insufficiently", "insufficiency", "insufficiencies"], answer: 0, explanation: "修飾名詞 funding,用形容詞 insufficient。" },
  { category: "wordform", sentence: "Her ____ to the project was greatly appreciated.", options: ["contribute", "contribution", "contributing", "contributive"], answer: 1, explanation: "作句子主詞,用名詞 contribution。" },
  { category: "subjectverb", sentence: "Each of the applicants ____ required to submit a résumé.", options: ["is", "are", "were", "have"], answer: 0, explanation: "Each of + 複數名詞,視為單數,用 is。" },
  { category: "subjectverb", sentence: "The list of items ____ posted on the board.", options: ["was", "were", "have been", "are"], answer: 0, explanation: "主詞為單數 list,用單數動詞 was。" },
  { category: "subjectverb", sentence: "The number of complaints ____ decreased this year.", options: ["has", "have", "were", "are"], answer: 0, explanation: "The number of + 複數名詞,視為單數,用 has。" },
  { category: "subjectverb", sentence: "A number of employees ____ requested more training.", options: ["has", "have", "is", "was"], answer: 1, explanation: "A number of + 複數名詞,視為複數,用 have。" },
  { category: "subjectverb", sentence: "All of the equipment ____ inspected before use.", options: ["is", "are", "were", "have"], answer: 0, explanation: "equipment 為不可數名詞,視為單數,用 is。" }
];

// ---------------- 閱讀(Part 6/7 風格,原創短文) ----------------
const PRACTICE_READING = [
  {
    title: "Office Renovation Notice",
    text: "To: All Staff\nFrom: Facilities Management\n\nThe third floor will undergo renovation beginning March 10. During this period, employees on that floor will be temporarily relocated to the second floor. The work is expected to be completed by the end of the month. Please note that the elevator will be out of service throughout the renovation, so employees are encouraged to use the stairs. We apologize for any inconvenience.",
    questions: [
      { q: "What is the purpose of this notice?", options: ["To announce a hiring event", "To inform staff about a renovation", "To introduce a new manager", "To advertise office space"], answer: 1 },
      { q: "Where will affected employees work during the renovation?", options: ["The first floor", "The second floor", "The fourth floor", "From home"], answer: 1 },
      { q: "Why are employees encouraged to use the stairs?", options: ["The elevator is out of service", "The stairs are faster", "For health reasons", "The elevator is being removed"], answer: 0 }
    ]
  },
  {
    title: "Customer Service Reply",
    text: "Dear Mr. Lee,\n\nThank you for contacting us about the blender you purchased last month. We are sorry the product stopped working after only two weeks. As a result, we would like to send you a free replacement unit. Please confirm your shipping address so that we can process your request promptly. We appreciate your business and apologize for the inconvenience.\n\nSincerely,\nCustomer Service",
    questions: [
      { q: "Why did Mr. Lee contact the company?", options: ["To place a new order", "Because a product stopped working", "To ask about a discount", "To change his address"], answer: 1 },
      { q: "What does the company offer Mr. Lee?", options: ["A partial refund", "A free replacement unit", "A discount coupon", "A repair service"], answer: 1 },
      { q: "What does the company ask Mr. Lee to do?", options: ["Return the product first", "Confirm his shipping address", "Call customer service", "Visit the store"], answer: 1 }
    ]
  },
  {
    title: "IT System Upgrade",
    text: "IT Department Notice\n\nThe company's email system will be upgraded this Saturday starting at 9:00 p.m. During the upgrade, employees will not be able to access their email accounts. The process is expected to take about six hours, and normal service should resume by Sunday morning. Employees who need to send urgent messages during this time should contact the IT help desk at extension 4521.",
    questions: [
      { q: "When will the email system be unavailable?", options: ["Friday night", "Saturday night into Sunday morning", "Sunday evening", "Monday morning"], answer: 1 },
      { q: "How long is the upgrade expected to take?", options: ["About two hours", "About six hours", "About twelve hours", "A full day"], answer: 1 },
      { q: "What should employees do to send urgent messages?", options: ["Use a personal email", "Contact the IT help desk", "Wait until Monday", "Visit the IT office"], answer: 1 }
    ]
  }
];
