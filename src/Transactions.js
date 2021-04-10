class RawTransaction {
    constructor({ date, desc, amount }) {
        this.date = date;
        this.desc = desc;
        this.amount = amount;
    }
}

class MeaningfulTransaction {
    constructor(account) {
        this["Account"] = account;
    }

    initFromRawTransaction(rawTransaction, pattern) {
        this["Date"] = rawTransaction.date;
        this["Main Cat."] = pattern["Main Cat."];
        this["Sub Cat."] = pattern["Sub Cat"];
        this["Contents"] = pattern["Contents"];
        this["Amount"] = Math.abs(rawTransaction.amount);
        this["Inc./Exp."] = pattern["Inc./Exp."];
        this["Details"] = pattern["Details"];
    }

    toTsvString() {
        let out = "";
        out += this["Date"] ? `${this["Date"]}\t` : "\t";
        out += this["Account"] ? `${this["Account"]}\t` : "\t";
        out += this["Main Cat."] ? `${this["Main Cat."]}\t` : "\t";
        out += this["Sub Cat."] ? `${this["Sub Cat."]}\t` : "\t";
        out += this["Contents"] ? `${this["Contents"]}\t` : "\t";
        out += this["Amount"] ? `${this["Amount"]}\t` : "\t";
        out += this["Inc./Exp."] ? `${this["Inc./Exp."]}\t` : "\t";
        out += this["Details"] ? `${this["Details"]}\t` : "\t";
        return out;
    }

    toString() {
        return JSON.stringify(this);
    }
}

exports.RawTransaction = RawTransaction;
exports.MeaningfulTransaction = MeaningfulTransaction;
