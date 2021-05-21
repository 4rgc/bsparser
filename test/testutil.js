const {
    RawTransaction,
    MeaningfulTransaction,
} = require("../src/Transactions");

const testPattern = {
    key: ["A", "B"],
    "Main Cat.": "Cat",
    "Sub Cat.": "Subcat",
    Contents: "AB",
    "Inc./Exp.": "Exp",
};

const testRawTransaction = new RawTransaction({
    date: "01/01/1970",
    desc: "A description",
    amount: 10,
});

const testMeaningfulTransaction = new MeaningfulTransaction("credit");
testMeaningfulTransaction.Amount = "10";
testMeaningfulTransaction.Contents = "description";
testMeaningfulTransaction.Date = "01/01/1970";
testMeaningfulTransaction.Details = "";
testMeaningfulTransaction["Inc./Exp."] = "exp";
testMeaningfulTransaction["Main Cat."] = "cat";
testMeaningfulTransaction["Sub Cat."] = "subcat";

const tsvTransactionOrder = [
    "Date",
    "Account",
    "Main Cat.",
    "Sub Cat.",
    "Contents",
    "Amount",
    "Inc./Exp.",
    "Details",
];

module.exports = {
    testPattern,
    testRawTransaction,
    testMeaningfulTransaction,
    tsvTransactionOrder,
};
