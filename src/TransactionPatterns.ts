const fs = require("fs");
import { RawTransaction } from './Transactions';
import { readFileAsText, Pattern } from "./util";

export type Category = {
    category: string,
    subcategories: string[]
}

export class TransactionPatterns {
    #patterns: Pattern[];
    #diskRelPath: string;
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
    addPattern(pattern: Pattern) {
        this.#patterns.push(pattern);
    }

    findMatchingPatterns(tra: RawTransaction) {
        return this.#patterns.filter((pattern) => {
            for (const patternKey of pattern.key) {
                if (tra.desc.includes(patternKey)) return true;
            }
            return false;
        });
    }

    getAllKeys() {
        let s = new Set();
        for (const pattern of this.#patterns) {
            s = new Set([...s, ...pattern.key]);
        }
        return [...s];
    }

    getAllContents() {
        return this.#patterns.map((pattern) => pattern["Contents"]);
    }

    getAllCategories() {
        let categories: Category[] = [
            ...new Set(this.#patterns.map((pattern) => pattern["Main Cat."])),
        ].map((c) => {
            return { category: c, subcategories: [] };
        });
        for (let category of categories) {
            let subcategories = [
                ...new Set(
                    this.#patterns.map((pattern) =>
                        {
                            const subcategory = pattern["Sub Cat."]
                                    ? pattern["Sub Cat."]
                                    : null;
                            return pattern["Main Cat."] === category.category
                                ? subcategory
                                : null;
                        }
                    )
                ),
            ];
            // remove null subcategories (from objects with no subcategory)
            category.subcategories = subcategories.filter((v): v is string => typeof v === "string");
        }
        return categories;
    }

    appendKeyToPattern(key: Pattern["key"][0], desc: string) {
        const foundPattern = this.#patterns.find((p) => p["Contents"] == desc);
        if(foundPattern)
            ["key"].push(key);
        else
            throw new Error("Not found a pattern to push a key in");
    }
}