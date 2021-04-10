const fs = require("fs");
const prompt = require("prompt");

function readFileAsText(path) {
    return fs.readFileSync(path, "utf-8");
}

function parseCSV(data) {
    let ret = [];
    let lines = data.split("\n");
    for (let i = 0; i < lines.length; i++) {
        let lineElements = ret[i].split(",");
        ret.push({
            date: lineElements[0],
            desc: lineElements[1],
            amount: lineElements[2],
        });
    }
}

prompt.start();
console.log("Please specify a path to the statement file: ");
prompt.get(["path"], (err, result) => {
    if (err) {
        console.log(err);
        return -1;
    }
    console.log(readFileAsText(result.path));
});
