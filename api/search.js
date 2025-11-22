// api/search.js
export default async function handler(req, res) {
    const { word } = req.query;

    // 1. 檢查有沒有給 word
    if (!word || !word.trim()) {
        return res.status(400).json({ error: '請提供 word 參數' });
    }

    try {
        // 2. 呼叫萌典的 raw API
        const url = `https://www.moedict.tw/raw/${encodeURIComponent(word.trim())}`;

        const response = await fetch(url);

        // 3. 如果萌典說查不到
        if (!response.ok) {
            return res.status(404).json({ error: '查無資料（萌典）' });
        }

        const data = await response.json();

        // 4. 把結果原封不動丟回去，可以之後在前端自己整理顯示
        return res.status(200).json({
            from: 'moedict',
            keyword: word,
            data,
        });
    } catch (error) {
        console.error('查萌典錯誤：', error);
        return res.status(500).json({
            error: '伺服器錯誤，請稍後再試',
            detail: error.message,
        });
    }
}
