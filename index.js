const fs = require("fs");
const prompt = require("prompt");

function readFileAsText(path) {
    return fs.readFileSync(path, "utf-8");
}

function parseCSV(data) {
    let ret = [];
    let lines = data.split("\n");
    console.log(lines);
    for (let i = 0; i < lines.length - 1; i++) {
        let lineElements = lines[i].split(",");
        ret.push({
            date: lineElements[0],
            desc: lineElements[1].substr(1, lineElements[1].length - 2),
            amount: Number.parseFloat(lineElements[2]),
        });
    }
    return ret;
}

prompt.start();
console.log(
    "Please specify a path to the statement file and the account (1-credit, 2-debit): "
);
prompt.get(["path", "creditDebit"], (err, result) => {
    if (err) {
        console.log(err);
        return -1;
    }

    let creditDebit = result.creditDebit;

    let text = readFileAsText(result.path);
    let known = JSON.parse(readFileAsText("keys.json"));
    let transactions = parseCSV(text);

    let outArray = [];

    for (let i = 0; i < transactions.length; i++) {
        let entriesFound = known.find((entry) => {
            for (let j = 0; j < entry.key.length; j++) {
                if (transactions[i].desc.includes(entry.key[j])) return true;
            }
            return false;
        });

        if (entriesFound) {
            if (Array.isArray(entriesFound)) {
                console.log(
                    `error: multiple matches found\ndesc: ${
                        transaction[i].desc
                    }\nkey entries: ${JSON.stringify(entriesFound)}`
                );
            }
            let outElem = { ...entriesFound };
            outElem.key = undefined;
            outElem["Date"] = transactions[i].date;
            outElem["Amount"] = Math.abs(transactions[i].amount);
            outArray.push(outElem);
        }
    }

    let outTxt =
        "Date\tAccount\tMain Cat.\tSub Cat.\tContents\tAmount\tInc./Exp.\tDetails\n";
    for (let i = 0; i < outArray.length; i++) {
        let cur = outArray[i];
        outTxt += cur["Date"] ? `${cur["Date"]}\t` : "\t";
        outTxt += creditDebit == 1 ? "クレジットカード\t" : "デビットカード\t";
        outTxt += cur["Main Cat."] ? `${cur["Main Cat."]}\t` : "\t";
        outTxt += cur["Sub Cat."] ? `${cur["Sub Cat."]}\t` : "\t";
        outTxt += cur["Contents"] ? `${cur["Contents"]}\t` : "\t";
        outTxt += cur["Amount"] ? `${cur["Amount"]}\t` : "\t";
        outTxt += cur["Inc./Exp."] ? `${cur["Inc./Exp."]}\t` : "\t";
        outTxt += cur["Details"] ? `${cur["Details"]}\t` : "\t";
        outTxt += "\n";
    }

    fs.writeFile("out.tsv", outTxt, () => {});
});
