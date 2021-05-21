const fs = require("fs");

function readFileAsText(path) {
    return fs.readFileSync(path, "utf-8");
}

function sum(a, b) {
    return a + b;
}

exports.readFileAsText = readFileAsText;
exports.sum = sum;
