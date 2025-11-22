const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    try {
        const filePath = path.join(__dirname, "..", "words_api.json");
        const json = fs.readFileSync(filePath, "utf8");
        res.statusCode = 200;
        res.end(json);
    } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Failed to load dictionary" }));
    }
};
