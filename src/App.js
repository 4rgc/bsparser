const fs = require("fs");
const prompt = require("prompt");
const { MeaningfulTransaction } = require("./Transactions");
const { TransactionPatterns } = require("./TransactionPatterns");
const { TransactionParser } = require("./TransactionParser");
const { readFileAsText } = require("./util");

class App {
    constructor() {
        this.patterns = new TransactionPatterns();
        this.patterns.loadPatterns();
    }

    async run() {
        let promptReceivedPromise = this.propmtUser();

        promptReceivedPromise.then((result) => {
            this.account =
                result.creditDebit == 1 ? "クレジットカード" : "デビットカード";

            let CSVdata = readFileAsText(result.path);
            this.transactions = TransactionParser.parseTransactionCSV(CSVdata);

            let meaningfulTransactions = this.buildMeaningfulTransactions();

            let outTxt = this.buildTsvFile(meaningfulTransactions);

            fs.writeFile("out.tsv", outTxt, () => {});
        });
    }

    propmtUser() {
        return new Promise((resolve, reject) => {
            prompt.start();
            console.log(
                "Please specify a path to the statement file and the account (1-credit, 2-debit): "
            );

            prompt.get(["path", "creditDebit"], (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    }

    buildTsvFile(meaningfulTransactions) {
        let outTxt =
            "Date\tAccount\tMain Cat.\tSub Cat.\tContents\tAmount\tInc./Exp.\tDetails\n";
        for (let i = 0; i < meaningfulTransactions.length; i++) {
            outTxt += meaningfulTransactions[i].toTsvString();
            outTxt += "\n";
        }
        return outTxt;
    }

    buildMeaningfulTransactions() {
        let meaningfulTransactions = [];

        for (let i = 0; i < this.transactions.length; i++) {
            let matchingPatterns = this.patterns.findMatchingPatterns(
                this.transactions[i]
            );

            if (matchingPatterns.length == 0) {
                throw new Error("error: no patterns found");
            }
            if (matchingPatterns.length > 1) {
                throw new Error(
                    `error: multiple matching patterns found\n\
                    transation:\n\
                    ${JSON.stringify(this.transactions[i])}\n\
                    patterns:\n\
                    ${JSON.stringify(matchingPatterns)}`
                );
            }

            meaningfulTransactions.push(
                this.buildMeaningfulTransaction(
                    matchingPatterns,
                    this.transactions[i]
                )
            );
        }
        return meaningfulTransactions;
    }

    buildMeaningfulTransaction(matchingPatterns, transaction) {
        if (matchingPatterns) {
            if (matchingPatterns.length > 1) {
                console.log(
                    `error: multiple matches found\ndesc: ${
                        transaction.desc
                    }\nkey entries: ${JSON.stringify(matchingPatterns)}`
                );
            }
            let foundPattern = matchingPatterns[0];
            let meaningfulTransaction = new MeaningfulTransaction(this.account);
            meaningfulTransaction.initFromRawTransaction(
                transaction,
                foundPattern
            );
            return meaningfulTransaction;
        }
    }
}

exports.App = App;
