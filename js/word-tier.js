/**
 * 詞彙分級判斷:核心字(core_3000) vs 擴展字(extended_7000)(需求文件 3.11 功能一)
 *
 * ⚠️ 誠實聲明:需求文件 2.3 / 3.11 規劃使用 Oxford 3000/5000 詞彙表做分級。Oxford 官方
 * CSV 尚未匯入(見 data/open-content/),這裡先內建一份「高頻核心字集合」作為近似 —— 涵蓋
 * 最常見的功能詞與高頻內容字、以及多益常見商務字。它「近似」核心 3000 那一層,但不是 Oxford
 * 官方清單本身。之後把 Oxford 3000/5000 清單放進 data/open-content/ 再改由檔案載入即可,
 * classify() 的介面不變。
 *
 * 分級用途(3.11):核心字 → 優先產生語塊卡片;擴展字 → 維持簡單辨識卡片即可。
 */

const CORE_WORDS = new Set([
  // 高頻功能詞 / 基礎動詞名詞形容詞
  "a","an","the","and","or","but","if","because","so","that","this","these","those","there",
  "be","is","am","are","was","were","been","being","have","has","had","do","does","did","done",
  "will","would","can","could","shall","should","may","might","must","need","want","get","got",
  "go","goes","went","gone","come","came","make","made","take","took","give","gave","find","found",
  "know","knew","think","thought","see","saw","look","use","used","work","call","try","ask","tell",
  "become","leave","left","put","mean","keep","let","begin","seem","help","show","hear","play","run",
  "move","live","believe","bring","happen","write","provide","sit","stand","lose","pay","meet","include",
  "continue","set","learn","change","lead","understand","watch","follow","stop","create","speak","read",
  "spend","grow","open","walk","win","offer","remember","consider","appear","buy","serve","send","expect",
  "build","stay","fall","reach","remain","suggest","raise","pass","sell","require","report","decide","pull",
  "good","new","first","last","long","great","little","own","other","old","right","big","high","different",
  "small","large","next","early","young","important","few","public","bad","same","able","best","better","free",
  "man","woman","child","people","time","year","day","week","month","hour","minute","world","life","hand",
  "part","place","case","week","company","system","program","question","government","number","night","point",
  "home","water","room","area","money","story","fact","month","lot","study","book","eye","job","word","business",
  "issue","side","kind","head","house","service","friend","father","mother","power","hour","game","line","end",
  "member","law","car","city","community","name","team","minute","idea","body","information","back","face","level",
  "office","door","health","person","art","war","history","result","change","morning","reason","research","girl","guy",
  // 高頻多益商務字(核心層)
  "meeting","report","email","manager","staff","customer","client","product","price","order","payment","invoice",
  "contract","project","schedule","deadline","budget","account","department","employee","interview","salary","benefit",
  "sale","market","brand","service","supplier","delivery","shipment","refund","discount","warranty","policy","approve",
  "confirm","submit","attend","cancel","reserve","book","charge","offer","hire","apply","train","manage","provide",
  "increase","decrease","reduce","improve","develop","launch","supply","deliver","purchase","register","complete","attach"
]);

const WordTier = {
  /**
   * 回傳 'core_3000' 或 'extended_7000'。
   * 規則:很短(<=2字母)或在核心字集合裡 → 核心;其餘視為擴展。
   */
  classify(word) {
    if (!word) return "extended_7000";
    const w = word.toLowerCase().trim();
    if (CORE_WORDS.has(w)) return "core_3000";
    // 常見規則變化:去掉字尾 s / ed / ing 再查一次
    const stems = [w.replace(/(ies)$/, "y"), w.replace(/(s|es)$/, ""), w.replace(/(ed|ing)$/, ""), w.replace(/(ed|ing)$/, "e")];
    if (stems.some((s) => CORE_WORDS.has(s))) return "core_3000";
    return "extended_7000";
  },

  isCore(word) {
    return this.classify(word) === "core_3000";
  }
};
