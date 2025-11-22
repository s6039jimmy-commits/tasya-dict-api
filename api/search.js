import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const { word } = req.query;

    if (!word) {
        return res.status(400).json({ error: '請提供 word 參數' });
    }

    // 讀取 JSON 檔
    const filePath = path.join(process.cwd(), 'words_api.json');
    const rawData = fs.readFileSync(filePath, 'utf8');
    const words = JSON.parse(rawData);

    // 模糊搜尋（支援：中文、英文、拼音）
    const result = words.filter(item =>
        item.traditional.includes(word) ||
        (item.simplified && item.simplified.includes(word)) ||
        item.pinyin.includes(word.toLowerCase()) ||
        item.english.toLowerCase().includes(word.toLowerCase())
    );

    if (result.length === 0) {
        return res.status(404).json({ error: "找不到結果" });
    }

    res.status(200).json(result);
}
