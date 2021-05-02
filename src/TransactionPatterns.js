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

    //TODO: add check for pattern existing
    addPattern(pattern) {
        this.#patterns.push(pattern);
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

    getAllKeys() {
        let s = new Set();
        for (let i = 0; i < this.#patterns.length; i++) {
            s = new Set([...s, ...this.#patterns[i].key]);
        }
        return [...s];
    }

    getAllContents() {
        return this.#patterns.map((pattern) => pattern["Contents"]);
    }

    getAllCategories() {
        let categories = [
            ...new Set(this.#patterns.map((pattern) => pattern["Main Cat."])),
        ].map((pattern) => {
            return { category: pattern };
        });
        for (let i = 0; i < categories.length; i++) {
            categories[i].subcategories = [
                ...new Set(
                    this.#patterns.map((pattern) =>
                        pattern["Main Cat."] === categories[i].category
                            ? pattern["Sub Cat."]
                            : null
                    )
                ),
            ];
            // remove null subcategories (from objects with no subcategory)
            categories[i].subcategories.splice(
                categories[i].subcategories.indexOf(null),
                1
            );
            categories[i].subcategories.splice(
                categories[i].subcategories.indexOf(undefined),
                1
            );
        }
        return categories;
    }

    appendKeyToPattern(key, desc) {
        this.#patterns.find((p) => p["Contents"] == desc)["key"].push(key);
    }
}
exports.TransactionPatterns = TransactionPatterns;
