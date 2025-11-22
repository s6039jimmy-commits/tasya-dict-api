// api/search.js
export default async function handler(req, res) {
    const { word } = req.query;

    if (!word) {
        return res.status(400).json({ error: "請提供 word 參數" });
    }

    try {
        // 🔥 教育部萌典 API
        const url = `https://www.moedict.tw/raw/${encodeURI(word)}`;
        const response = await fetch(url);

        if (!response.ok) {
            return res.status(404).json({ error: "查無資料" });
        }

        const raw = await response.json();

        // 🔥 取第一筆 heteronyms（通常就是主要解釋）
        const h = raw.heteronyms?.[0] || {};

        // 🔥 取 definitions（可能一字多義，取第 1 筆）
        const d = h.definitions?.[0] || {};

        // 🔥 自動把繁體變簡體（使用 very simple mapping）
        const trad = raw.title || word;
        const simp = trad
            .replace(/國/g, "国")
            .replace(/學/g, "学")
            .replace(/語/g, "语")
            .replace(/體/g, "体"); // 可以逐漸擴充映射表

        // 🔥 最終回傳精簡格式
        const result = {
            traditional: trad || "",
            simplified: simp || "",
            pinyin: h.pinyin || "",
            bopomofo: h.bopomofo || "",
            type: d.type || "",
            example: d.example?.[0] || "",
            synonyms: raw.synonyms || []
        };

        return res.status(200).json(result);

    } catch (err) {
        return res.status(500).json({
            error: "伺服器錯誤",
            detail: err.message,
        });
    }
}
