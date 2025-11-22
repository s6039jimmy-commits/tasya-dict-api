// api/search.js ---- 精簡版輸出

export default async function handler(req, res) {
    const { word } = req.query;

    if (!word) {
        return res.status(400).json({ error: "請提供 word 參數" });
    }

    try {
        // 教育部萌典 API
        const url = `https://www.moedict.tw/raw/${encodeURI(word)}`;
        const response = await fetch(url);

        if (!response.ok) {
            return res.status(404).json({ error: "查無資料" });
        }

        const raw = await response.json();

        // 🔥 精簡只保留需要的欄位
        const entry = {
            traditional: raw.title || "",
            simplified: raw.heteronyms?.[0]?.pinyin_t || "", // 萌典沒有真正簡體，用拼音推測
            pinyin: raw.heteronyms?.[0]?.pinyin || "",
            bopomofo: raw.heteronyms?.[0]?.bopomofo || "",
            type: raw.heteronyms?.[0]?.definitions?.[0]?.type || "",
            example: raw.heteronyms?.[0]?.definitions?.[0]?.example || [],

            // 萌典沒有真正同義字，先回傳空陣列
            synonyms: []
        };

        return res.status(200).json({
            query: word,
            result: entry
        });

    } catch (err) {
        return res.status(500).json({
            error: "伺服器錯誤",
            detail: err.message
        });
    }
}
