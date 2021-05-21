const { MeaningfulTransaction } = require("../src/Transactions");
const {
    testPattern,
    testRawTransaction,
    testMeaningfulTransaction,
    tsvTransactionOrder,
} = require("./testutil");

describe("MeaningfulTransaction", () => {
    test("initFromRawTransaction", () => {
        let mt = new MeaningfulTransaction("credit");
        let rt = testRawTransaction;

        mt.initFromRawTransaction(rt, testPattern);

        expect(mt.Account).toBe("credit");
        expect(mt.Amount).toBe(rt.amount);
        expect(mt.Contents).toBe(testPattern.Contents);
        expect(mt.Date).toBe(rt.date);
        expect(mt.Details).toBe(testPattern["Details"]);
        expect(mt["Inc./Exp."]).toBe(testPattern["Inc./Exp."]);
        expect(mt["Main Cat."]).toBe(testPattern["Main Cat."]);
        expect(mt["Sub Cat."]).toBe(testPattern["Sub Cat."]);
    });

    test("toTsvString", () => {
        const mt = testMeaningfulTransaction;
        const tsvMt = mt.toTsvString();
        const splitTsvMt = tsvMt.split("\t");

        for (let i = 0; i < tsvTransactionOrder.length; i++) {
            expect(splitTsvMt[i]).toBe(mt[tsvTransactionOrder[i]]);
        }
    });
});
