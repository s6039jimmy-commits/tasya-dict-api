// api/search.js

export default async function handler(req, res) {
    const { word } = req.query;

    if (!word) {
        return res.status(400).json({ error: "請提供 word 參數" });
    }

    try {
        // 教育部萌典官方 API
        const url = `https://www.moedict.tw/raw/${encodeURI(word)}`;

        const response = await fetch(url);

        // 404 或查不到資料
        if (!response.ok) {
            return res.status(404).json({ error: "查無資料" });
        }

        // 取得 JSON 回傳
        const data = await response.json();

        return res.status(200).json({
            query: word,
            result: data
        });

    } catch (err) {
        return res.status(500).json({
            error: "伺服器錯誤",
            detail: err.message,
        });
    }
}
