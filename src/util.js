const fs = require("fs");

function readFileAsText(path) {
    return fs.readFileSync(path, "utf-8");
}

module.exports.readFileAsText = readFileAsText;
