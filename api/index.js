const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    const filePath = path.join(process.cwd(), 'words_api.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const WORDS = JSON.parse(raw);

    const { q } = req.query;
    if (!q) {
        return res.status(200).json({ error: 'No query provided' });
    }

    const query = q.trim().toLowerCase();

    // 搜尋繁體 / 英文 / 注音
    const result = WORDS.find(w =>
        w.traditional === query ||
        w.simplified === query ||
        w.bopomofo.includes(query) ||
        w.english.toLowerCase().includes(query)
    );

    if (!result) {
        return res.status(200).json({ traditional: '(找不到結果)' });
    }

    res.status(200).json(result);
};
