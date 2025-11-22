import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const { word } = req.query;

    // 讀取 JSON 字典
    const file = path.join(process.cwd(), 'words_api.json');
    const raw = fs.readFileSync(file, 'utf8');
    const words = JSON.parse(raw);

    // 尋找資料
    const result = words.find(
        (w) =>
            w.traditional === word ||
            (w.english && w.english.toLowerCase().includes(word.toLowerCase()))
    );

    if (!result) {
        return res.status(200).json({ error: '找不到結果' });
    }

    res.status(200).json(result);
}
