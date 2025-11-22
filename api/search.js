// api/search.js
// 不用 opencc、不用讀檔，全部寫在這支檔案裡

// 繁 -> 簡（單字）
const CHAR_T2S = {
  "網": "网",
  "絡": "络",
  "電": "电",
  "腦": "脑",
  "話": "话",
  "系": "系",
  "統": "统",
  "內": "内",
  "訊": "讯",
  "學": "学",
  "習": "习",
  "開": "开"
};

// 簡 -> 繁（單字）
const CHAR_S2T = {
  "网": "網",
  "络": "絡",
  "电": "電",
  "脑": "腦",
  "话": "話",
  "系": "系",
  "统": "統",
  "内": "內",
  "讯": "訊",
  "学": "學",
  "习": "習",
  "开": "開"
};

// 詞彙級：繁 -> 簡
const PHRASE_T2S = {
  "網路": "网络",
  "資訊": "信息",
  "內建": "内置",
  "系統": "系统"
};

// 詞彙級：簡 -> 繁
const PHRASE_S2T = {
  "网络": "網路",
  "信息": "資訊",
  "内置": "內建",
  "系统": "系統"
};

// 繁體 → 簡體
function toSimplified(text = "") {
  if (!text) return "";
  // 先轉詞
  for (const [trad, simp] of Object.entries(PHRASE_T2S)) {
    text = text.replaceAll(trad, simp);
  }
  // 再轉單字
  return [...text].map(ch => CHAR_T2S[ch] || ch).join("");
}

// 簡體 → 繁體
function toTraditional(text = "") {
  if (!text) return "";
  // 先轉詞
  for (const [simp, trad] of Object.entries(PHRASE_S2T)) {
    text = text.replaceAll(simp, trad);
  }
  // 再轉單字
  return [...text].map(ch => CHAR_S2T[ch] || ch).join("");
}

// 判斷是不是純英文
function isEnglish(text = "") {
  const hasLatin = /[A-Za-z]/.test(text);
  const hasCJK = /[\u3400-\u9FFF]/.test(text);
  return hasLatin && !hasCJK;
}

// 用 LibreTranslate 做翻譯
async function translate(text, source, target) {
  if (!text) return "";
  try {
    const resp = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source,
        target,
        format: "text"
      })
    });

    const data = await resp.json();
    return data.translatedText || "";
  } catch (e) {
    return "";
  }
}

export default async function handler(req, res) {
  const { word: rawWord } = req.query;

  if (!rawWord) {
    return res.status(400).json({ error: "請提供 word 參數" });
  }

  let input = String(rawWord).trim();
  let lookupWord = input; // 拿來丟萌典

  try {
    // ① 如果是英文，先翻成中文再查萌典
    if (isEnglish(input)) {
      const zh = await translate(input, "en", "zh");
      // 拿翻回來中文的第一個詞當關鍵字
      lookupWord = zh.split(/[，。,、；;!\s]/)[0] || zh || input;
    }

    // ② 不管輸入是簡體 / 繁體，都先轉成繁體拿去查萌典
    const queryTraditional = toTraditional(lookupWord);

    // ③ 向萌典要資料（萌典只吃繁體）
    const apiUrl = `https://www.moedict.tw/raw/${encodeURI(queryTraditional)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return res.status(404).json({ error: "查無資料" });
    }

    const raw = await response.json();
    const hetero = raw.heteronyms?.[0] || {};
    const defs = hetero.definitions || [];

    // ④ 把所有中文解釋翻成英文（多句）
    const chineseDefs = defs.map(d => d.def).filter(Boolean);
    const englishList = [];
    for (const def of chineseDefs) {
      const en = await translate(def, "zh", "en");
      englishList.push(en);
    }

    // ⑤ 組你要的六個欄位
    const traditional = raw.title || queryTraditional || lookupWord;

    const result = {
      traditional,                     // 繁體
      bopomofo: hetero.bopomofo || "", // 注音
      simplified: toSimplified(traditional), // 簡體（詞彙級）
      pinyin: hetero.pinyin || "",     // 拼音
      english: englishList,            // 英文解釋（陣列）
      type: defs[0]?.type || ""        // 詞性（第一個義項）
    };

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      error: "伺服器錯誤",
      detail: String(err)
    });
  }
}
