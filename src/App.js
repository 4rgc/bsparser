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

            this.patterns.savePatterns();
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

            if (matchingPatterns.length == 0) {
                let newPattern = await this.processPatternOrSkipTransaction(
                    this.transactions[i]
                );
                if (newPattern) {
                    this.patterns.addPattern(newPattern);
                }
                i--;
                continue;
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

    removeTransactionsBefore(dateBefore) {
        this.transactions = this.transactions.filter((transaction) => {
            let transactionDate = moment(transaction.date, [
                "M/D/YYYY",
                "MM/D/YYYY",
                "M/DD/YYYY",
                "MM/DD/YYYY",
            ]);
            return transactionDate.isAfter(moment(dateBefore, "DD/MM/YYYY"));
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
        return this.promptPatternKey(transaction)
            .then((key) => {
                return this.createOrAppendToPattern(key);
            })
            .then((res) => {
                return res;
            });
    }

    createOrAppendToPattern(key) {
        return this.promptCreateOrAppendToPattern().then((result) => {
            if (result.choice == 1) {
                return this.createNewPattern(key);
            } else if (result.choice == 2) {
                return this.appendToPattern(key);
            } else {
                throw new Error("invalid choice (exp. 1/2)");
            }
        });
    }

    promptCreateOrAppendToPattern() {
        let msg = `Would you like to create a new pattern or append it to an existing one? \
                    \n\t1 - Create \
                    \n\t2 - Append`;
        return this.promptMultipleChoice(msg, 2);
    }

    createNewPattern(key) {
        let description;
        let category;
        let subcategory;
        let incomeExpense;
        return this.promptNewPatternDescription()
            .then((res) => {
                description = res;
            })
            .then(() => this.promptCategoryChoice())
            .then((res) => {
                category = res;
            })
            .then(() => this.promptSubcategoryChoice(category))
            .then((res) => (subcategory = res))
            .then(() => this.promptIncomeOrExpense())
            .then((res) => (incomeExpense = res))
            .then(() => {
                let pattern = {
                    key: [key],
                    Contents: description,
                    "Main Cat.": category.category,
                    "Sub Cat.": subcategory,
                    "Inc./Exp.": incomeExpense,
                };
                if (!subcategory) {
                    delete pattern["Sub Cat."];
                }
                return pattern;
            });
    }

    promptNewPatternDescription() {
        let msg = "Enter description for the new pattern: ";
        let descriptions = this.patterns.getAllContents();

        let wrongInputMsg =
            "This description is already in use. Please try again.";

        let conformCondition = (desc) => !descriptions.includes(desc);

        return this.promptConformingText(msg, conformCondition, wrongInputMsg);
    }

    promptCategoryChoice() {
        let msg = "Choose a category for the new pattern: \n";
        let categories = this.patterns.getAllCategories();
        categories.push({ category: "Make new" });
        let categoriesStr = "";
        for (let i = 0; i < categories.length; i++) {
            categoriesStr += i + 1 + " – " + categories[i].category + "\t";
            if ((i + 1) % 5 == 0) categoriesStr += "\n";
        }

        return this.promptMultipleChoice(
            msg + categoriesStr,
            categories.length
        ).then((res) => {
            if (res.choice == categories.length) {
                return this.promptNewCategory(categories);
            } else if (res.choice > categories.length) {
                throw new Error(
                    `invalid choice (exp. 1-${categories.length + 1}`
                );
            }
            return categories[res.choice - 1];
        });
    }

    promptNewCategory(categories) {
        let msg = "Enter the name of the new category:";

        let conformCondition = (input) => !categories.includes(input);

        let wrongInputMsg =
            "This subcategory already exists. Please try again.";

        return this.promptConformingText(
            msg,
            conformCondition,
            wrongInputMsg
        ).then((res) => {
            return { category: res };
        });
    }

    promptSubcategoryChoice(category) {
        let msg = "Choose a subcategory for the new pattern: \n";
        let foundCategory = this.patterns
            .getAllCategories()
            .find((c) => JSON.stringify(c) === JSON.stringify(category));
        let subcategories = foundCategory ? foundCategory.subcategories : [];
        subcategories.push("Make new");
        subcategories.push("None");
        let subcategoriesStr = "";
        for (let i = 0; i < subcategories.length; i++) {
            subcategoriesStr += i + 1 + " – " + subcategories[i] + "\t";
            if ((i + 1) % 5 == 0) subcategoriesStr += "\n";
        }

        return this.promptMultipleChoice(
            msg + subcategoriesStr,
            subcategories.length
        ).then((res) => {
            if (res.choice == subcategories.length - 1) {
                return this.promptNewSubcategory(subcategories);
            } else if (res.choice == subcategories.length) {
                return undefined;
            } else if (res.choice > subcategories.length) {
                throw new Error(
                    `invalid choice (exp. 1-${subcategories.length + 1}`
                );
            }
            return subcategories[res.choice - 1];
        });
    }

    promptNewSubcategory(subcategories) {
        let msg = "Enter the name of the new subcategory:";

        let conformCondition = (input) => !subcategories.includes(input);

        let wrongInputMsg =
            "This subcategory already exists. Please try again.";

        return this.promptConformingText(msg, conformCondition, wrongInputMsg);
    }

    promptIncomeOrExpense() {
        let msg = `Is the transaction with this pattern an income or an expanse? \
                \n\t1 – Income \
                \n\t2 – Expense`;

        return this.promptMultipleChoice(msg, 2).then((res) => {
            if (res.choice == 1) return "収入";
            else if (res.choice == 2) return "支出";
            else throw new Error("invalid choice (exp. 1/2)");
        });
    }

    appendToPattern(key) {
        return this.promptAppendPatternChoice().then((res) => {
            this.patterns.appendKeyToPattern(key, res);
        });
    }

    promptAppendPatternChoice() {
        let descriptions = this.patterns.getAllContents();

        let msg = "Choose which pattern you want to append the key to:\n";
        let descriptionsStr = "";
        for (let i = 0; i < descriptions.length; i++) {
            descriptionsStr += i + 1 + " – " + descriptions[i] + "\t";
            if ((i + 1) % 5 == 0) descriptionsStr += "\n";
        }

        return this.promptMultipleChoice(
            msg + descriptionsStr,
            descriptions.length
        ).then((res) => {
            if (res.choice > descriptions.length)
                throw new Error(
                    `invalid choice (exp. 1-${descriptions.length}`
                );
            return descriptions[res.choice - 1];
        });
    }

    promptPatternKey(transaction) {
        let msg = `Enter the key of the following transaction text: \
                    \n\t${transaction.desc}`;

        let conformCondition = (input) => transaction.desc.includes(input);

        let wrongInputMsg = `This description is not a part of the transaction. Please try again. \
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
                        conform: (input) =>
                            Number.isInteger(
                                Number(input == "" ? undefined : input)
                            ) &&
                            input > 0 &&
                            input <= choiceNumber,
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
