// api/search.js
import fs from 'fs'
import path from 'path'

// 讀取你自己的 TOCFL 字典
const localPath = path.join(process.cwd(), 'words_api.json')
let LOCAL_WORDS = []
try {
    const raw = fs.readFileSync(localPath, 'utf8')
    LOCAL_WORDS = JSON.parse(raw)
} catch (e) {
    console.error('讀取 words_api.json 失敗：', e)
}

// 統一把查詢字串處理一下
function normalize(str = '') {
    return str.trim()
}

// 在你自己的 words_api.json 裡面找
function searchLocal(word) {
    const w = normalize(word)
    if (!w) return []

    const lower = w.toLowerCase()
    return LOCAL_WORDS.filter(item => {
        return (
            item.traditional === w ||
            item.simplified === w ||
            (item.pinyin && item.pinyin.toLowerCase().includes(lower)) ||
            (item.english && item.english.toLowerCase().includes(lower))
        )
    })
}

// 把萌典回傳的格式轉成你 App 用的格式
function mapMoedictJson(json, keyword) {
    const title = json.title || keyword
    const heteronyms = json.heteronyms || []

    return heteronyms.map(h => ({
        source: 'moedict',
        traditional: title,
        bopomofo: h.bopomofo || '',
        pinyin: h.pinyin || '',
        // 萌典是中文釋義，沒有英文，這裡先留空陣列
        english: [],
        // 把所有 def（字義）抓出來
        definitions: (h.definitions || []).map(d => d.def),
    }))
}

export default async function handler(req, res) {
    const { word } = req.query

    if (!word || !word.trim()) {
        return res.status(400).json({ error: '請輸入要查的字或單字（word 參數）' })
    }

    const keyword = normalize(word)

    // 1️⃣ 先查本地 TOCFL 字典
    const localResult = searchLocal(keyword)
    if (localResult.length > 0) {
        return res.status(200).json({
            source: 'local',
            items: localResult,
        })
    }

    // 2️⃣ 找不到 →去問萌典 API（/uni/ 會回傳 Unicode 正常版 JSON）
    try {
        const moeUrl = `https://www.moedict.tw/uni/${encodeURIComponent(keyword)}`
        const moeRes = await fetch(moeUrl)

        if (!moeRes.ok) {
            return res.status(404).json({ error: '找不到結果（外部字典）' })
        }

        const moeJson = await moeRes.json()
        const mapped = mapMoedictJson(moeJson, keyword)

        if (!mapped.length) {
            return res.status(404).json({ error: '找不到結果（外部字典）' })
        }

        return res.status(200).json({
            source: 'moedict',
            items: mapped,
        })
    } catch (err) {
        console.error('查萌典失敗：', err)
        return res.status(500).json({ error: '外部字典發生錯誤，稍後再試試看' })
    }
}
