
import t2s from "./dict-t2s.json" assert { type: "json" };
import s2t from "./dict-s2t.json" assert { type: "json" };

function convertT2S(text) {
  if (!text) return text;

  // Phrase-level
  for (const key of Object.keys(t2s)) {
    if (text.includes(key)) {
      text = text.replace(new RegExp(key, "g"), t2s[key]);
    }
  }
  return text;
}

export default async function handler(req, res) {
  const { word: rawWord } = req.query;

  if (!rawWord) {
    return res.status(400).json({ error: "請提供 word 參數" });
  }

  let word = String(rawWord).trim();

  try {
    const url = `https://www.moedict.tw/raw/${encodeURI(word)}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(404).json({ error: "查無資料" });
    }

    const raw = await response.json();
    const hetero = raw.heteronyms?.[0] || {};
    const defs = hetero.definitions || [];

    const result = {
      traditional: raw.title || word,
      bopomofo: hetero.bopomofo || "",
      simplified: convertT2S(raw.title || word),
      pinyin: hetero.pinyin || "",
      english: defs.map(d => d.def || ""),
      type: defs[0]?.type || ""
    };

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      error: "伺服器錯誤",
      detail: String(err)
    });
  }
}
