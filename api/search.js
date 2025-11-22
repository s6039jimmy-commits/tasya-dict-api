// api/search.js

export default async function handler(req, res) {
    const { word } = req.query;

    if (!word) {
        return res.status(400).json({ error: "請提供 word 參數" });
    }

    try {
        // 教育部萌典 API（官方 RAW JSON）
        const url = `https://www.moedict.tw/raw/${encodeURIComponent(word)}`;

        const response = await fetch(url);

        // 萌典回 404 = 查無資料
        if (!response.ok) {
            return res.status(404).json({ error: "查無資料" });
        }

        const data = await response.json();

        // 回傳成功
        return res.status(200).json({
            query: word,
            result: data,
        });

    } catch (err) {
        return res.status(500).json({
            error: "伺服器錯誤",
            detail: err.message,
        });
    }
}
