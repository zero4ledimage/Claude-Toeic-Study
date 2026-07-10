#!/usr/bin/env node
/**
 * ECDICT → 多益/雅思常用字彙子集 + KK 音標轉換腳本
 *
 * 用法:
 *   1. 下載 ECDICT 的 ecdict.csv(約 66MB,77 萬詞條):
 *      curl -o data/dictionary/ecdict-raw.csv \
 *        https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv
 *      (這個原始檔案很大,不會 commit 進 git,已加入 .gitignore)
 *   2. 在 repo 根目錄執行 npm install(安裝 opencc-js,簡轉繁用)
 *   3. 執行: node scripts/convert-ecdict.js
 *   4. 產出: data/dictionary/dict-subset.json(約 15,000-20,000 字的精簡子集,含 KK 音標)
 *
 * 中文釋義處理:ECDICT 是中國大陸專案,釋義為簡體中文。這裡用 OpenCC 的
 * cn→twp 模式一次性轉成台灣正體(twp 除了字形轉換,還會把大陸慣用語彙換成
 * 台灣慣用語,例如 内存→記憶體、软件→軟體),轉換發生在建置期,前端載入的
 * JSON 已是正體,執行期零成本。
 *
 * ============================================================
 * 關於 IPA/DJ → KK 音標轉換的重要說明(寫給日後維護者,也已同步告知使用者):
 *
 * 需求文件 3.7 節原本預期這是「20-30 組符號替換規則」的單純工程工作。實際下載
 * ECDICT 資料檢查後發現:它的音標欄位主要是**英式(RP)音標**,而且不同詞條之間
 * 記法還不完全一致(部分用完整 IPA 符號如 ɪ/ʊ/ɜ,部分用簡化的純字母 i/u/e;
 * 甚至同一個字母有兩種 Unicode 編碼混用,如西里爾字母 ә 和真正的 IPA ə)。
 *
 * 英式音標轉美式 KK 音標,不是單純的符號對應,原因:
 *   1. 英式非兒化(non-rhotic):car唸成 kɑ:,字尾的 r 音直接消失不發音;
 *      美式 KK 是兒化的,car 要唸成 kɑr。所以凡是拼字有 r 但音標把 r 音吃掉的
 *      地方,都要「補回」r 音,但音標本身的文字內容並不會告訴你哪裡漏了 r,
 *      必須額外參照原始拼字才能判斷,這是規則式轉換裡最不單純的一塊。
 *   2. BATH/TRAP 母音分裂:英式的 ɑ: 有兩種來源,一種美式對應 ɑ(如 car、
 *      father),一種美式對應 æ(如 class、dance、path)。這兩種在英式音標
 *      上寫法完全一樣,差別只能靠「這個字到底是哪一類」的詞彙表來區分,
 *      不是規則能算出來的。
 *
 * 因應做法(務實妥協,非百分之百精準的語音學轉寫,但對背單字/做題已經夠用):
 *   - 字尾非重音 schwa(ə/ә),若拼字結尾符合 r/re/ar/or/er/ur/yr,補上兒化
 *     (轉成 ɚ),或補上字面 r(視情況)
 *   - ə:/ɜ:(重音的央母音+長音)一律視為兒化重音母音,轉成 ɝ(不論在字中
 *     哪個位置,因為這個符號在資料裡幾乎只用來表示這種音)
 *   - BATH/TRAP 用一份常見字清單(BATH_WORDS,約 70-80 字)做例外表,不在清單裡
 *     的一律當作 ɑ(較常見的情況)
 *   - **已知限制**:非重音、非字尾的 r 化母音(例如 perceive 的第一音節)無法
 *     單靠規則正確補回兒化音,會保留成無 r 版本。這類狀況在教材裡比例不算太高,
 *     且多半是非重音音節,對學習者辨識單字影響較小,但仍在此明確記錄這個限制。
 * ============================================================
 */

const fs = require("fs");
const path = require("path");

let toTraditional;
try {
  const OpenCC = require("opencc-js");
  toTraditional = OpenCC.Converter({ from: "cn", to: "twp" });
} catch (e) {
  console.error("找不到 opencc-js,請先在 repo 根目錄執行 npm install(見本檔案開頭的使用說明)。");
  process.exit(1);
}

const RAW_PATH = path.join(__dirname, "..", "data", "dictionary", "ecdict-raw.csv");
const OUT_PATH = path.join(__dirname, "..", "data", "dictionary", "dict-subset.json");

// ---------- BATH/TRAP 例外清單(英式 ɑ: 對應美式 æ 而非 ɑ 的常見字) ----------
const BATH_WORDS = new Set([
  "ask","asks","asked","asking","basket","bath","baths","blast","branch","branches",
  "calf","calves","can't","cast","castle","chance","chances","chant","class","classes",
  "clasp","command","commander","commands","contrast","craft","dance","dances","demand",
  "demands","disaster","draft","drafts","enhance","example","examples","fasten","fast",
  "faster","fastest","glance","glances","glass","glasses","grant","grants","grasp","grass",
  "half","halves","laugh","laughs","laughter","last","mask","masks","master","masters",
  "nasty","pass","passes","passage","past","path","paths","plant","plants","plaster",
  "raft","rather","sample","samples","shan't","staff","standard","task","tasks","transfer",
  "vast","aunt","aunts","advance","advances","advantage","advantages","answer","answers",
  "France","French"
]);

function parseCsvLine(line) {
  const fields = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function hasCJK(str) {
  return /[一-鿿]/.test(str);
}

// 多字元/歧義樣式一律先轉成獨一無二的佔位符,確保後面的單字元規則
// 不會誤傷已經處理過的內容(例如 "i:" 轉成的 i 不能再被 "i"→"ɪ" 的規則重複處理)。
// 每一組都同時列出 ascii 簡化寫法與正規 IPA 寫法,因為資料裡兩種都有可能出現。
const PLACEHOLDER_RULES = [
  [/ə:|ɜ:?/g, "§NURSE§"],
  [/ɒ:|ɔ:/g, "§THOUGHT§"],
  [/ɑ:/g, "§PALM§"],
  [/eə|ɛə/g, "§SQUARE§"], // ɛə:資料裡的 ε/є 變體在步驟1已正規化為 ɛ,這裡要一併吃掉
  // ascii 寫法的 iə/uə 只在後面跟著 r(連音 r)時才視為 NEAR/CURE 雙母音,
  // 否則像 schedule 的 'skedʒuәl 這種真正的 u+ə 序列會被誤傷
  [/(?:ɪə|iə)(?=r)/g, "§NEAR§"],
  [/ɪə/g, "§NEAR§"],
  [/(?:ʊə|uə)(?=r)/g, "§CURE§"],
  [/ʊə/g, "§CURE§"],
  [/ɒi|ɔɪ|ɔi/g, "§CHOICE§"],
  [/eɪ|ei/g, "§FACE§"],
  [/əu|ou|oʊ/g, "§GOAT§"],
  [/aɪ|ai/g, "§PRICE§"],
  [/aʊ|au/g, "§MOUTH§"],
  [/i:/g, "§FLEECE§"],
  [/u:/g, "§GOOSE§"]
];

const PLACEHOLDER_RESOLVE = (word) => [
  [/§NURSE§/g, "ɝ"],
  [/§THOUGHT§/g, "ɔ"],
  [/§PALM§/g, BATH_WORDS.has(word.toLowerCase()) ? "æ" : "ɑ"],
  // SQUARE/NEAR/CURE 資料裡常已帶連音 r(如 vɛəriəs),後面已有 r 時只轉母音,避免疊字
  [/§SQUARE§(?=r)/g, "ɛ"],
  [/§SQUARE§/g, "ɛr"],
  [/§NEAR§(?=r)/g, "ɪ"],
  [/§NEAR§/g, "ɪr"],
  [/§CURE§(?=r)/g, "ʊ"],
  [/§CURE§/g, "ʊr"],
  [/§CHOICE§/g, "ɔɪ"],
  [/§FACE§/g, "e"],
  [/§GOAT§/g, "o"],
  [/§PRICE§/g, "aɪ"],
  [/§MOUTH§/g, "aʊ"],
  [/§FLEECE§/g, "i"],
  [/§GOOSE§/g, "u"]
];

function convertToKK(rawPhonetic, word) {
  if (!rawPhonetic) return "";
  if (hasCJK(rawPhonetic)) return ""; // 資料髒污,略過

  // 1) 標準化各種同形異碼字元
  let s = rawPhonetic
    .replace(/ә/g, "ə")
    .replace(/[εє]/g, "ɛ")
    .replace(/ɡ/g, "g")
    .replace(/[ˊ´]/g, "ˌ")
    .replace(/'/g, "ˈ")
    .replace(/ː/g, ":")
    .replace(/ū/g, "u:");

  // 2) 多字元/歧義樣式 → 佔位符(見上方註解,避免與步驟3規則衝突)
  for (const [pattern, token] of PLACEHOLDER_RULES) {
    s = s.replace(pattern, token);
  }

  // 3) 剩餘的單一字母母音符號(此時已不含任何會被誤傷的多字元組合)
  s = s
    .replace(/i/g, "ɪ") // KIT
    .replace(/u/g, "ʊ") // FOOT
    .replace(/e/g, "ɛ") // DRESS
    .replace(/ɒ/g, "ɑ"); // 殘餘的 LOT(理論上多半已被步驟2的佔位符吸收)

  // 4) 解析佔位符為最終 KK 符號(PALM/BATH 分流在這裡依單字判斷)
  for (const [pattern, replacement] of PLACEHOLDER_RESOLVE(word)) {
    s = s.replace(pattern, replacement);
  }

  // 5) 字尾兒化補回(依拼字判斷是否漏了 r 音,見檔頭說明的已知限制)
  const lower = word.toLowerCase();
  const endsWithR = /r$/.test(lower) || /re$/.test(lower);
  // 只檢查「輸出字串本身結尾是否已經是 r」,不是整串裡有沒有 r ——
  // 像 mirror 這種拼字中間已經有一個 r 的字,結尾仍然需要補兒化音。
  if (endsWithR && !/r$/.test(s)) {
    if (/ə$/.test(s)) {
      s = s.replace(/ə$/, "ɚ");
    } else if (/[a-zɑɔɛæʌ]$/.test(s)) {
      s = s + "r";
    }
  }

  return s;
}

function firstMeaning(translation) {
  if (!translation) return "";
  const lines = translation.split("\\n").map((l) => l.trim()).filter(Boolean);
  return lines.slice(0, 2).join("; ");
}

function shouldInclude(row) {
  const tag = (row.tag || "").toLowerCase();
  if (tag.includes("ielts") || tag.includes("toefl") || tag.includes("cet4") || tag.includes("cet6") || tag.includes("gre")) {
    return true;
  }
  if (row.oxford === "1") return true;
  const frq = parseInt(row.frq, 10);
  if (!isNaN(frq) && frq > 0 && frq <= 20000) return true;
  return false;
}

function main() {
  if (!fs.existsSync(RAW_PATH)) {
    console.error(`找不到原始檔案:${RAW_PATH}`);
    console.error("請先下載 ECDICT 的 ecdict.csv 並放到這個路徑,見本檔案開頭的使用說明。");
    process.exit(1);
  }

  const raw = fs.readFileSync(RAW_PATH, "utf-8");
  const lines = raw.split("\n");
  const header = parseCsvLine(lines[0]);
  const idx = {};
  header.forEach((h, i) => (idx[h.trim()] = i));

  const out = {};
  let included = 0;
  let total = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;
    total++;
    const fields = parseCsvLine(line);
    const row = {
      word: fields[idx.word],
      phonetic: fields[idx.phonetic],
      translation: fields[idx.translation],
      oxford: fields[idx.oxford],
      tag: fields[idx.tag],
      frq: fields[idx.frq]
    };
    if (!row.word || hasCJK(row.word)) continue;
    if (!shouldInclude(row)) continue;

    const kk = convertToKK(row.phonetic, row.word);
    const meaning = firstMeaning(row.translation);
    if (!meaning) continue;

    out[row.word.toLowerCase()] = { word: row.word, kk, meaning: toTraditional(meaning) };
    included++;
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out));
  console.log(`處理 ${total} 筆原始資料,篩選出 ${included} 筆寫入 ${OUT_PATH}`);
}

module.exports = { convertToKK, shouldInclude, firstMeaning, parseCsvLine };

if (require.main === module) {
  main();
}
