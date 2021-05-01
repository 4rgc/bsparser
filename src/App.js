//TODO: FOR TESTING PURPOSES
const process = require("process");
//--------------------------
const fs = require("fs");
const prompt = require("prompt");
const { MeaningfulTransaction } = require("./Transactions");
const { TransactionPatterns } = require("./TransactionPatterns");
const { TransactionCSVParser } = require("./TransactionCSVParser");
const { readFileAsText } = require("./util");
const moment = require("moment");
const resolvePath = require("path").resolve;

class App {
    constructor() {
        this.patterns = new TransactionPatterns();
        this.patterns.loadPatterns();
    }

    async run() {
        let promptReceivedPromise = this.propmtUser();

        promptReceivedPromise.then(async (result) => {
            this.account =
                result.creditDebit == 1 ? "クレジットカード" : "デビットカード";

            let CSVdata = readFileAsText(result.path);
            this.transactions = TransactionCSVParser.parseTransactionCSV(
                CSVdata
            );
            this.removeTransactionsBefore(result.dateBefore);

            let meaningfulTransactions = await this.buildMeaningfulTransactions();

            let outTxt = this.buildTsvFile(meaningfulTransactions);

            fs.writeFile("out.tsv", outTxt, () => {});
        });
    }

    propmtUser() {
        return new Promise((resolve, reject) => {
            prompt.start();
            console.log(
                "Please specify a path to the statement file and the account: "
            );

            var schema = {
                properties: {
                    path: {
                        pattern: /^[\/]?([^/ ]*[\/])*([^/ ]+)$/,
                        message: "Must be a valid path to a file",
                        required: true,
                    },
                    creditDebit: {
                        message: "1-credit, 2-debit",
                        required: true,
                    },
                    dateBefore: {
                        pattern: /((0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/[12]\d{3})/,
                        message:
                            "The date must be in the following format: dd/mm/yyyy",
                        required: true,
                    },
                },
            };

            prompt.get(schema, (err, result) => {
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

    async buildMeaningfulTransactions() {
        let meaningfulTransactions = [];

        for (let i = 0; i < this.transactions.length; i++) {
            let matchingPatterns = this.patterns.findMatchingPatterns(
                this.transactions[i]
            );

            console.log("before");

            if (matchingPatterns.length == 0) {
                console.log("0 patterns");
                let newPattern = await this.processPatternOrSkipTransaction(
                    this.transactions[i]
                );
            }

            console.log("after");

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

    removeTransactionsBefore(dateBefore) {
        this.transactions = this.transactions.filter((transaction) => {
            let transationDate = moment(transaction.date, [
                "M/D/YYYY",
                "MM/D/YYYY",
                "M/DD/YYYY",
                "MM/DD/YYYY",
            ]);
            return transationDate.isAfter(moment(dateBefore, "DD/MM/YYYY"));
        });
    }

    processPatternOrSkipTransaction(transaction) {
        return this.promptProcessPatternOrSkipTransaction().then((result) => {
            if (result.choice == 1) return this.processNewPattern(transaction);
            else if (result.choice == 2) return;
            else reject();
        });
    }

    promptProcessPatternOrSkipTransaction() {
        let msg = `A new pattern was found. Would you like to add it or skip the transaction?\
                \n1 - Add \
                \n2 - Skip`;

        return this.promptMultipleChoice(msg, 2);
    }

    processNewPattern(transaction) {
        let key;
        let description;

        return this.promptPatternKey(transaction)
            .then((result) => {
                key = result;
                return this.createOrAppendToPattern();
            })
            .then((res) => {
                description = res;

                console.log(`key: ${key} description: ${description}`);
                process.exit(1);
            });
    }

    createOrAppendToPattern() {
        return this.promptCreateOrAppendToPattern().then((result) => {
            if (result.choice == 1) {
                return this.createNewPattern();
            }
        });
    }

    promptCreateOrAppendToPattern() {
        console.log("ok here 3");
        let msg = `Would you like to create a new pattern or append it to an existing one? \
                    1 - Create \
                    2 - Append`;
        return this.promptMultipleChoice(msg, 2);
    }

    createNewPattern() {
        //TODO: change return value to initialized pattern object
        return this.promptNewPatternDescription();
    }

    promptNewPatternDescription() {
        let msg = `Enter description for the new pattern: `;
        let descriptions = this.patterns.getAllContents();
        //let categories = this.patterns.getAllCategories();

        let wrongInputMsg =
            "This description is already in use. Please try again.";

        let conformCondition = (desc) => !descriptions.includes(desc);

        return this.promptConformingText(msg, conformCondition, wrongInputMsg);
    }

    promptPatternKey(transaction) {
        let keys = this.patterns.getAllKeys();
        let msg = `Enter the key of the following transaction text: \
                    \n\t${transaction.desc}`;

        let conformCondition = (input) =>
            transaction.desc.includes(input) || !keys.includes(input);

        let wrongInputMsg = `This description is not a part of the transaction or is already in use. Please try again. \
                    \n\t${transaction.desc}`;
        return this.promptConformingText(msg, conformCondition, wrongInputMsg);
    }

    promptMultipleChoice(message, choiceNumber) {
        return new Promise((resolve, reject) => {
            prompt.start();
            console.log(message);

            var schema = {
                properties: {
                    choice: {
                        pattern: new RegExp("^[1-" + choiceNumber + "]$"),
                        message: "Please enter a valid choice",
                        required: true,
                    },
                },
            };

            prompt.get(schema, (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    }

    promptText(msg) {
        return new Promise((resolve, reject) => {
            prompt.start();
            console.log(msg);

            var schema = {
                properties: {
                    text: {
                        required: true,
                    },
                },
            };

            prompt.get(schema, (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    }

    promptConformingText(msg, conformCb, wrongTextMsg) {
        return new Promise((resolve, reject) => {
            prompt.start();
            console.log(msg);

            var schema = {
                properties: {
                    text: {
                        conform: conformCb,
                        message: wrongTextMsg,
                        required: true,
                    },
                },
            };

            prompt.get(schema, (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result.text);
            });
        });
    }
}

exports.App = App;
