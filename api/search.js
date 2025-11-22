import OpenCC from "opencc-js";

export default async function handler(req, res) {
    const { word } = req.query;

    if (!word) {
        return res.status(400).json({ error: "請提供 word 參數" });
    }

    try {
        // 1️⃣ 取得萌典資料
        const url = `https://www.moedict.tw/raw/${encodeURI(word)}`;
        const response = await fetch(url);

        if (!response.ok) {
            return res.status(404).json({ error: "查無資料" });
        }

        const raw = await response.json();

        const hetero = raw.heteronyms?.[0] || {};
        const defs = hetero.definitions || [];

        // 2️⃣ 提取所有中文義項
        const chineseDefs = defs.map(d => d.def).filter(Boolean);

        // 3️⃣ 把每個義項翻成英文（多句）
        let englishList = [];
        for (const def of chineseDefs) {
            try {
                const transRes = await fetch("https://libretranslate.de/translate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        q: def,
                        source: "zh",
                        target: "en",
                        format: "text"
                    })
                });

                const transJson = await transRes.json();
                englishList.push(transJson.translatedText || "");
            } catch (err) {
                englishList.push("");
            }
        }

        // 4️⃣ 繁 → 簡（OpenCC）
        const converter = OpenCC.Converter({ from: "tw", to: "cn" });
        const simplified = converter(raw.title || "");

        // 5️⃣ 整理你要的 6 個欄位
        const entry = {
            traditional: raw.title || "",
            bopomofo: hetero.bopomofo || "",
            simplified: simplified,
            pinyin: hetero.pinyin || "",
            english: englishList,   // ← 多句英文解釋（你選 B）
            type: defs[0]?.type || ""
        };

        return res.status(200).json(entry);

    } catch (err) {
        return res.status(500).json({
            error: "伺服器錯誤",
            detail: err.message
        });
    }
}
