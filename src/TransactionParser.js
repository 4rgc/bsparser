const { RawTransaction } = require("./Transactions");

class TransactionParser {
    static parseTransactionCSV(csvData) {
        let ret = [];
        let lines = csvData.split("\n");
        for (let i = 0; i < lines.length - 1; i++) {
            let lineElements = lines[i].split(",");
            ret.push(
                new RawTransaction({
                    date: lineElements[0],
                    desc: lineElements[1].substr(1, lineElements[1].length - 2),
                    amount: Number.parseFloat(lineElements[2]),
                })
            );
        }
        return ret;
    }
}
exports.TransactionParser = TransactionParser;
