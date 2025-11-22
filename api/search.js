// api/search.js

// --- ① 引入 Web 版 OpenCC（純 JS，不依賴 node，Vercel 可用） ---
async function loadOpenCC() {
    const module = await import("https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/esm/index.mjs");
    return module;
}

export default async function handler(req, res) {
    const { word } = req.query;

    if (!word) {
        return res.status(400).json({ error: "請提供 word 參數" });
    }

    try {
        // --- ② 取得萌典資料 ---
        const url = `https://www.moedict.tw/raw/${encodeURI(word)}`;
        const response = await fetch(url);

        if (!response.ok) {
            return res.status(404).json({ error: "查無資料" });
        }

        const raw = await response.json();
        const hetero = raw.heteronyms?.[0] || {};
        const defs = hetero.definitions || [];

        // --- ③ 提取所有中文義項 ---
        const chineseDefs = defs.map(d => d.def).filter(Boolean);

        // --- ④ 翻譯所有義項（英文解釋：多句） ---
        let englishList = [];
        for (const def of chineseDefs) {
            try {
                const r = await fetch("https://libretranslate.de/translate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        q: def,
                        source: "zh",
                        target: "en",
                        format: "text"
                    })
                });

                const data = await r.json();
                englishList.push(data.translatedText || "");
            } catch {
                englishList.push("");
            }
        }

        // --- ⑤ 載入 OpenCC（繁 → 簡） ---
        const { OpenCC } = await loadOpenCC();
        const converter = OpenCC.Converter({ from: "tw", to: "cn" });
        const simplified = converter(raw.title || "");

        // --- ⑥ 回傳你要的六項目 ---
        const result = {
            traditional: raw.title || "",
            bopomofo: hetero.bopomofo || "",
            simplified: simplified, // ← 完整簡體字 OK
            pinyin: hetero.pinyin || "",
            english: englishList,   // ← 多句英文
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
