const fs = require("fs");
const { readFileAsText } = require("./util");

class TransactionPatterns {
    #patterns;
    #diskRelPath;
    constructor() {
        this.#patterns = [];
        this.#diskRelPath = "patterns.json";
    }

    loadPatterns() {
        this.#patterns = JSON.parse(readFileAsText("patterns.json"));
    }

    async savePatterns() {
        fs.writeFile(
            this.#diskRelPath,
            JSON.stringify(this.#patterns),
            () => {}
        );
    }

    findMatchingPatterns(tra) {
        let matchingPatterns = this.#patterns.filter((pattern) => {
            for (let j = 0; j < pattern.key.length; j++) {
                if (tra.desc.includes(pattern.key[j])) return true;
            }
            return false;
        });
        return matchingPatterns;
    }
}
exports.TransactionPatterns = TransactionPatterns;
