// TOEIC Part 6 (短文填空) 與 Part 7 (單篇/雙篇閱讀測驗) 題庫

// ---------------- Part 6: 短文填空 (5 篇短文 x 4 題 = 20 題) ----------------
// 每篇短文包含 text (含 ___(n)___ 標記) 與 blanks 陣列

const PART6_DATA = [
  {
    id: 1,
    title: "Office Renovation Notice",
    text: "To: All Staff\nFrom: Facilities Management\nSubject: Office Renovation Notice\n\nWe would like to inform you that the third floor will undergo renovation beginning March 10. During this period, employees will be temporarily ___(1)___ to the second floor. All renovation work is expected to be completed by the end of the month. ___(2)___, please note that the elevator will be out of service throughout the renovation period. ___(3)___ We ___(4)___ for any inconvenience this may cause and appreciate your patience.",
    blanks: [
      { num: 1, options: ["relocated", "canceled", "promoted", "resigned"], answer: 0, explanation: "文意為員工暫時「搬遷」至二樓,須用 relocated。" },
      { num: 2, options: ["However", "In addition", "Therefore", "For example"], answer: 1, explanation: "此句補充另一項注意事項(電梯停用),須用表示補充的 In addition。" },
      { num: 3, options: ["Employees are encouraged to use the stairs during this time.", "The company will be closed for the national holiday next week.", "New employees will begin orientation on Monday.", "The cafeteria menu has been updated for the spring season."], answer: 0, explanation: "承接上句電梯停用的資訊,合理的下一句是建議員工改走樓梯。" },
      { num: 4, options: ["apologize", "apologized", "will apologize", "apologizing"], answer: 0, explanation: "正式通知中常用現在式表達歉意,故用 apologize。" }
    ]
  },
  {
    id: 2,
    title: "Customer Service Reply",
    text: "Dear Mr. Thompson,\n\nThank you for contacting us ___(1)___ the defective blender you purchased last month. We are sorry to hear that the product stopped working after only two weeks of use. ___(2)___, we would like to send you a free replacement unit. Please confirm your shipping address so that we can process your request ___(3)___. ___(4)___\n\nSincerely,\nCustomer Service Team",
    blanks: [
      { num: 1, options: ["about", "of", "for", "at"], answer: 0, explanation: "contact someone about something 為固定搭配。" },
      { num: 2, options: ["However", "As a result", "In the meantime", "Nevertheless"], answer: 1, explanation: "因為產品有瑕疵,「因此」提供免費替換品,須用 As a result。" },
      { num: 3, options: ["promptly", "rarely", "previously", "hardly"], answer: 0, explanation: "文意為盡快處理要求,須用 promptly(迅速地)。" },
      { num: 4, options: ["We appreciate your continued business and apologize for the inconvenience.", "Our store will be closed on public holidays.", "The warranty period for this product is five years.", "Please note that all sales are final."], answer: 0, explanation: "作為客服信件的結尾,感謝顧客並致歉最為合適。" }
    ]
  },
  {
    id: 3,
    title: "Spring Clearance Sale",
    text: "Spring Clearance Sale!\n\nVisit ABC Department Store from April 1 to April 15 and enjoy discounts of up to 50 percent ___(1)___ selected items. ___(2)___, customers who spend over $100 will receive a complimentary gift. ___(3)___ All sale items are ___(4)___ while supplies last, so don't miss this opportunity to save.",
    blanks: [
      { num: 1, options: ["on", "at", "for", "in"], answer: 0, explanation: "discount on something 為固定搭配。" },
      { num: 2, options: ["In addition", "However", "Therefore", "Otherwise"], answer: 0, explanation: "補充另一項優惠訊息,須用 In addition。" },
      { num: 3, options: ["The store will also extend its hours during the sale period.", "Our new branch will open next year.", "Employee applications are currently being accepted.", "The company reported strong earnings last quarter."], answer: 0, explanation: "與促銷活動直接相關的延伸資訊(延長營業時間)最合適。" },
      { num: 4, options: ["available", "unavailable", "canceled", "delayed"], answer: 0, explanation: "文意為特價商品「售完為止」,須用 available。" }
    ]
  },
  {
    id: 4,
    title: "Parking Garage Closure",
    text: "Notice to All Employees\n\nBeginning next Monday, the parking garage on Elm Street will be ___(1)___ for repairs. Employees who normally park there should use the temporary lot located behind the building. ___(2)___, a shuttle will run every 15 minutes between the temporary lot and the main entrance. ___(3)___ We apologize for any inconvenience and thank you for your understanding. The repair work ___(4)___ to be completed within three weeks.",
    blanks: [
      { num: 1, options: ["closed", "opened", "expanded", "sold"], answer: 0, explanation: "因維修而「關閉」停車場,須用 closed。" },
      { num: 2, options: ["In the meantime", "Otherwise", "Consequently", "Nevertheless"], answer: 0, explanation: "表示在此期間會提供接駁車服務,須用 In the meantime。" },
      { num: 3, options: ["This service will be available from 7 a.m. to 7 p.m. on weekdays.", "The company picnic has been rescheduled to next month.", "New hires must complete their paperwork by Friday.", "The garage was originally built ten years ago."], answer: 0, explanation: "承接上句接駁車服務,補充服務時間最合理。" },
      { num: 4, options: ["expect", "expects", "is expected", "expecting"], answer: 2, explanation: "維修工程「被預期」完成,須用被動語態 is expected。" }
    ]
  },
  {
    id: 5,
    title: "Order Confirmation Letter",
    text: "Dear Ms. Rivera,\n\nThank you for your recent order. We are pleased to confirm that your order ___(1)___ shipped on June 5 and should arrive within five to seven business days. ___(2)___, please note that a signature will be required upon delivery. ___(3)___ If you have any questions about your order, please do not hesitate to contact our support team ___(4)___.",
    blanks: [
      { num: 1, options: ["was", "is", "has", "will"], answer: 0, explanation: "訂單已於6月5日「被出貨」,為過去發生的動作,須用被動過去式 was shipped。" },
      { num: 2, options: ["Additionally", "Otherwise", "Nevertheless", "In contrast"], answer: 0, explanation: "補充另一項出貨相關資訊(需簽收),須用 Additionally。" },
      { num: 3, options: ["You will receive a tracking number by email within 24 hours.", "Our office will be relocating next quarter.", "We are currently hiring for several positions.", "The product comes in three different colors."], answer: 0, explanation: "與出貨/配送流程直接相關的下一步資訊最合適。" },
      { num: 4, options: ["directly", "rarely", "previously", "hardly"], answer: 0, explanation: "文意為可「直接」聯繫客服團隊,須用 directly。" }
    ]
  }
];

// ---------------- Part 7: 單篇閱讀 (10 篇 x 3 題 = 30 題) ----------------

const PART7_SINGLE_DATA = [
  {
    id: 1,
    title: "Job Posting",
    text: "Marketing Coordinator - ABC Corp\n\nABC Corp is seeking a Marketing Coordinator to join our growing team. The ideal candidate will have at least two years of experience in digital marketing and strong writing skills. Responsibilities include managing social media accounts, coordinating promotional campaigns, and analyzing customer engagement data. This is a full-time position based in our downtown office, with the possibility of one remote workday per week. Interested applicants should submit a résumé and cover letter to careers@abccorp.com by July 20. Only candidates selected for an interview will be contacted.",
    questions: [
      { q: "What is the purpose of this notice?", options: ["To announce a company merger", "To advertise a job opening", "To promote a new product", "To announce an office closure"], answer: 1 },
      { q: "What is a requirement for the position?", options: ["A graduate degree", "Fluency in a second language", "At least two years of digital marketing experience", "Five years of management experience"], answer: 2 },
      { q: "How should interested applicants apply?", options: ["By calling the office", "By visiting in person", "By emailing a résumé and cover letter", "By submitting an online form"], answer: 2 }
    ]
  },
  {
    id: 2,
    title: "IT Department Notice",
    text: "IT Department Notice\n\nThe company's email system will be upgraded this Saturday, October 14, starting at 9:00 p.m. During the upgrade, employees will not be able to access their email accounts. The process is expected to take approximately six hours, and normal service should resume by Sunday morning. Employees who need to send urgent messages during this time should contact the IT help desk directly at extension 4521. We recommend saving any important drafts before Saturday evening. Thank you for your patience as we work to improve our email system's speed and security.",
    questions: [
      { q: "When will the email system be unavailable?", options: ["Friday afternoon", "Saturday night into Sunday morning", "Sunday evening", "All week"], answer: 1 },
      { q: "What should employees do before the upgrade?", options: ["Change their passwords", "Save important drafts", "Contact their supervisor", "Back up their computers"], answer: 1 },
      { q: "How can employees send urgent messages during the upgrade?", options: ["By using a personal email account", "By visiting the IT department in person", "By contacting the IT help desk at extension 4521", "By waiting until Monday"], answer: 2 }
    ]
  },
  {
    id: 3,
    title: "Café Luna Review",
    text: "Café Luna: A New Favorite Downtown\n\nCafé Luna opened its doors last month on Baker Street, and it has quickly become a popular spot for lunch among local office workers. The café offers a variety of sandwiches, salads, and soups, all made with locally sourced ingredients. What sets Café Luna apart is its quick service — most orders are ready within ten minutes, making it ideal for a short lunch break. The café is open Monday through Friday from 7 a.m. to 4 p.m. On weekends, it is closed for private events only. Reviewers have particularly praised the café's friendly staff and reasonable prices.",
    questions: [
      { q: "What is one reason Café Luna is popular among office workers?", options: ["Its late-night hours", "Its quick service", "Its live music", "Its large portions"], answer: 1 },
      { q: "When is the café open to the general public?", options: ["Monday through Friday, 7 a.m. to 4 p.m.", "Every day, 24 hours", "Weekends only", "Monday through Sunday, 9 a.m. to 9 p.m."], answer: 0 },
      { q: "What have reviewers praised about the café?", options: ["Its location and parking", "The friendly staff and reasonable prices", "Its large menu of desserts", "Its outdoor seating"], answer: 1 }
    ]
  },
  {
    id: 4,
    title: "Product Recall Notice",
    text: "Product Notice: Voluntary Recall\n\nSafeHome Appliances is voluntarily recalling its Model X200 electric kettle due to a potential overheating issue. Customers who purchased this model between January and April of this year should stop using the product immediately. To receive a full refund or a free replacement, customers should visit our website at www.safehomeappliances.com/recall and complete the online form. Once the form is submitted, a prepaid shipping label will be emailed within two business days. Customers with questions may also call our customer service line at 1-800-555-0199.",
    questions: [
      { q: "Why is the kettle being recalled?", options: ["Because of a packaging error", "Because of a potential overheating issue", "Because it was discontinued", "Because of a price change"], answer: 1 },
      { q: "What should affected customers do first?", options: ["Call customer service", "Return the item to a store", "Complete the online form on the website", "Wait for a company representative to visit"], answer: 2 },
      { q: "What will customers receive after submitting the form?", options: ["An immediate cash refund", "A prepaid shipping label by email", "A new catalog", "A discount coupon"], answer: 1 }
    ]
  },
  {
    id: 5,
    title: "Leadership Training Reminder",
    text: "All Department Managers,\n\nPlease be reminded that the annual leadership training workshop will take place on November 8 in Conference Room B. All department managers are required to attend, as the session will cover updates to the performance evaluation process. The workshop will begin promptly at 9 a.m. and is expected to conclude by 1 p.m. Lunch will be provided. Please confirm your attendance with Human Resources no later than November 1. Managers who are unable to attend must arrange for a representative to attend in their place.",
    questions: [
      { q: "Who is required to attend the workshop?", options: ["All new employees", "All department managers", "Only HR staff", "Only senior executives"], answer: 1 },
      { q: "What topic will the workshop cover?", options: ["Updates to the performance evaluation process", "New office safety rules", "The company's annual budget", "Changes to the dress code"], answer: 0 },
      { q: "What must managers do if they cannot attend?", options: ["Submit a written excuse", "Reschedule the entire workshop", "Arrange for a representative to attend instead", "Watch a recording later"], answer: 2 }
    ]
  },
  {
    id: 6,
    title: "Flight Delay Announcement",
    text: "Attention Passengers\n\nFlight 245 to Chicago has been delayed due to unfavorable weather conditions. The flight is now expected to depart at 6:45 p.m. from Gate 12, approximately two hours later than originally scheduled. Passengers are advised to remain in the boarding area and listen for further announcements. Those with connecting flights affected by this delay should speak with a gate agent for assistance with rebooking. We apologize for any inconvenience this delay may cause.",
    questions: [
      { q: "Why has Flight 245 been delayed?", options: ["Due to a mechanical issue", "Due to unfavorable weather conditions", "Due to a staffing shortage", "Due to a security concern"], answer: 1 },
      { q: "What should passengers with connecting flights do?", options: ["Book a new flight online", "Speak with a gate agent for rebooking assistance", "Wait at baggage claim", "Contact the airline by phone only"], answer: 1 },
      { q: "About how long is the flight delayed?", options: ["30 minutes", "One hour", "Approximately two hours", "All day"], answer: 2 }
    ]
  },
  {
    id: 7,
    title: "FitZone Membership Advertisement",
    text: "Join FitZone Today!\n\nSign up for a FitZone membership this month and receive 20 percent off your first three months. Our facility features state-of-the-art equipment, a wide range of group classes, and certified personal trainers available for one-on-one sessions. New members will also receive a complimentary fitness assessment during their first visit. This offer is valid for new members only and expires at the end of the month. Visit any FitZone location or sign up online at www.fitzone.com to take advantage of this limited-time offer.",
    questions: [
      { q: "What does the 20 percent discount apply to?", options: ["Personal training sessions only", "The first three months of membership", "Merchandise purchases", "Group classes only"], answer: 1 },
      { q: "What do new members receive during their first visit?", options: ["A free T-shirt", "A complimentary fitness assessment", "A one-year warranty", "A gift card"], answer: 1 },
      { q: "Who is eligible for this offer?", options: ["All current members", "New members only", "Employees of FitZone", "Anyone who refers a friend"], answer: 1 }
    ]
  },
  {
    id: 8,
    title: "Company Expansion Article",
    text: "Local Firm Announces Expansion\n\nGreenfield Technologies, a software company based in Austin, announced this week that it will open a new office in Denver next spring. The expansion is part of the company's plan to strengthen its presence in the western United States. The Denver office is expected to create approximately 150 new jobs over the next two years, primarily in software development and customer support. Company officials stated that the decision was driven by strong client demand in the region. Hiring for the new office is expected to begin in January.",
    questions: [
      { q: "Why is Greenfield Technologies opening a new office?", options: ["To reduce operating costs", "To strengthen its presence in the western United States", "To relocate its headquarters", "To merge with another company"], answer: 1 },
      { q: "How many jobs is the new office expected to create?", options: ["About 50", "About 150", "About 500", "About 1,000"], answer: 1 },
      { q: "When is hiring expected to begin?", options: ["Immediately", "Next spring", "In January", "Next year"], answer: 2 }
    ]
  },
  {
    id: 9,
    title: "Meeting Cancellation Email",
    text: "Dear Team,\n\nI am writing to let you know that tomorrow's budget meeting has been canceled due to a scheduling conflict. We will reschedule the meeting for early next week and will send a new invitation once the date is confirmed. In the meantime, please continue reviewing the budget proposal document that was shared last Friday, as your feedback will still be needed. Thank you for your understanding.\n\nBest regards,\nJason",
    questions: [
      { q: "Why was the meeting canceled?", options: ["Due to a scheduling conflict", "Due to a power outage", "Due to low attendance", "Due to a budget cut"], answer: 0 },
      { q: "What are team members asked to do in the meantime?", options: ["Submit their own proposals", "Continue reviewing the budget proposal document", "Wait for further instructions only", "Attend a different meeting instead"], answer: 1 },
      { q: "When will the meeting most likely take place?", options: ["Later the same day", "Early next week", "Next month", "It has been canceled permanently"], answer: 1 }
    ]
  },
  {
    id: 10,
    title: "Library Hours Notice",
    text: "Notice: Updated Hours of Operation\n\nBeginning next month, the company library will adjust its hours of operation. The library will now open at 8 a.m., one hour earlier than before, but will close at 5 p.m. instead of 6 p.m. These changes are being made in response to a survey showing that most employees use the library in the morning. The library will continue to be closed on weekends and public holidays. Employees with questions about the new hours may contact the library staff at extension 3310.",
    questions: [
      { q: "Why are the library's hours changing?", options: ["Because of budget cuts", "Because a survey showed most employees use it in the morning", "Because the library is being relocated", "Because of new safety regulations"], answer: 1 },
      { q: "What time will the library now close?", options: ["4 p.m.", "5 p.m.", "6 p.m.", "7 p.m."], answer: 1 },
      { q: "When is the library closed?", options: ["Every evening", "On weekends and public holidays", "On Mondays only", "It is never closed"], answer: 1 }
    ]
  }
];

// ---------------- Part 7: 雙篇閱讀 (2 組 x 5 題 = 10 題) ----------------

const PART7_DOUBLE_DATA = [
  {
    id: 1,
    title: "Interview Invitation & Reply",
    passageA: { label: "Email 1", text: "To: Laura Kim\nFrom: HR Department, Bright Star Inc.\nSubject: Interview Invitation\n\nDear Ms. Kim,\n\nThank you for applying for the Junior Accountant position at Bright Star Inc. We were impressed with your qualifications and would like to invite you for an interview on Wednesday, August 14, at 10 a.m. at our main office. Please bring a copy of your résumé and two forms of identification. If this time does not work for you, please let us know as soon as possible so we can arrange an alternative.\n\nWe look forward to meeting you.\n\nBest regards,\nHR Department" },
    passageB: { label: "Email 2", text: "To: HR Department\nFrom: Laura Kim\nSubject: RE: Interview Invitation\n\nDear HR Department,\n\nThank you very much for the invitation. Unfortunately, I have a prior commitment on August 14 and will not be able to attend at the scheduled time. Would it be possible to reschedule the interview to August 15 or 16 instead? I am available any time after 1 p.m. on either day. Thank you for your understanding, and I look forward to hearing from you.\n\nSincerely,\nLaura Kim" },
    questions: [
      { q: "What position did Laura Kim apply for?", options: ["Marketing Coordinator", "Junior Accountant", "HR Assistant", "Office Manager"], answer: 1 },
      { q: "What does the HR Department ask Laura to bring to the interview?", options: ["A laptop", "A résumé and two forms of identification", "A writing sample", "A list of references only"], answer: 1 },
      { q: "Why does Laura Kim want to reschedule the interview?", options: ["She is out of the country", "She has a prior commitment on August 14", "She did not receive the email in time", "She no longer wants the job"], answer: 1 },
      { q: "When is Laura Kim available for the interview?", options: ["August 14 in the morning", "August 15 or 16, after 1 p.m.", "Any day before August 14", "Only on weekends"], answer: 1 },
      { q: "What most likely happens next?", options: ["HR will confirm a new interview time", "Laura will withdraw her application", "The position will be filled by someone else", "The interview will be canceled permanently"], answer: 0 }
    ]
  },
  {
    id: 2,
    title: "Furniture Sale Ad & Customer Email",
    passageA: { label: "Advertisement", text: "GreenLeaf Furniture - Summer Sale\n\nSave up to 30% on all outdoor furniture now through August 31! Free delivery is included for orders over $200 within the city limits. All items come with a one-year warranty. To place an order, visit our showroom or shop online at www.greenleaffurniture.com. Orders placed online typically arrive within 7 to 10 business days." },
    passageB: { label: "Customer Email", text: "To: Customer Service\nFrom: Daniel Park\nSubject: Delayed Order #48213\n\nHello,\n\nI placed an order for a patio table and chairs on July 5 through your website, and the order confirmation stated delivery within 7 to 10 business days. It has now been three weeks, and I have not yet received my order. Could you please check the status of order #48213 and let me know when I can expect delivery? I would also like to know if I am eligible for any compensation given the delay.\n\nThank you,\nDaniel Park" },
    questions: [
      { q: "What discount is being offered in the advertisement?", options: ["Up to 10% off indoor furniture", "Up to 30% off outdoor furniture", "Free furniture with any purchase", "50% off all items"], answer: 1 },
      { q: "Under what condition is delivery free?", options: ["For any order amount", "For orders over $200 within the city limits", "Only for in-store pickup", "Only during the first week of the sale"], answer: 1 },
      { q: "What problem does Daniel Park describe in his email?", options: ["He received the wrong item", "His order has not arrived after three weeks", "He was charged twice", "The item he received was damaged"], answer: 1 },
      { q: "What does Daniel Park ask about besides the delivery status?", options: ["A refund policy", "Whether he is eligible for compensation", "How to cancel his order", "The store's return address"], answer: 1 },
      { q: "According to the advertisement, how long should delivery normally take?", options: ["1 to 2 business days", "3 to 5 business days", "7 to 10 business days", "Over a month"], answer: 2 }
    ]
  }
];
