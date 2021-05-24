import { TransactionPatterns } from "../src/TransactionPatterns";
import { readFileAsText } from "../src/util";
import { writeFile } from "fs";
import { testPatterns } from "./testutil";
import equal from "deep-equal";

jest.mock("../src/util");
jest.mock("fs");

describe("TransactionPatterns", () => {
    let patternBank;
    beforeEach(() => {
        patternBank = new TransactionPatterns("path");
        patternBank.patterns = [...testPatterns];
    });

    describe("loadPatterns()", () => {
        let path;
        beforeAll(() => {
            readFileAsText.mockImplementation(
                jest.fn((p) => `file contents at ${p}`)
            );
            JSON.parse = jest.fn();
        });
        afterAll(() => {
            jest.unmock("../src/util");
            jest.unmock(JSON.parse);
        });
        beforeEach(() => {
            path = patternBank.diskRelPath;
            patternBank.loadPatterns();
        });
        afterEach(() => {
            jest.clearAllMocks();
        });

        test("should call readFileAsText", () => {
            expect(readFileAsText).toBeCalledTimes(1);
        });

        test("should call JSON.parse with file contents", () => {
            expect(JSON.parse).toBeCalledTimes(1);
            expect(JSON.parse).toBeCalledWith(`file contents at ${path}`);
        });
    });

    describe("savePatterns()", () => {
        let path;
        beforeAll(() => {
            writeFile.mockImplementation(jest.fn());
        });
        beforeEach(() => {
            path = patternBank.diskRelPath;
            patternBank.patterns = {
                path,
                prop2: 1,
            };
            patternBank.savePatterns();
        });
        afterEach(() => {
            jest.clearAllMocks();
        });
        afterAll(() => {
            jest.unmock(fs);
        });
        test("should call fs.writeFile with the stringified patterns", () => {
            expect(writeFile).toBeCalledTimes(1);
            expect(writeFile.mock.calls[0][0]).toBe(patternBank.diskRelPath);
            expect(writeFile.mock.calls[0][1]).toBe(
                JSON.stringify(patternBank.patterns)
            );
        });
    });

    describe("addPattern()", () => {
        test("should add the pattern to the inside array", () => {
            const newPattern = { name: "a", lmao: "b" };
            const prevPatterns = [...patternBank.patterns];
            patternBank.addPattern(newPattern);
            expect(patternBank.patterns).toEqual([...prevPatterns, newPattern]);
        });
    });

    describe("findMatchingPatterns()", () => {
        test("should return a matching pattern object", () => {
            const testPattern = testPatterns[0];
            const testTransaction = {
                date: "01/01/1970",
                desc: `${testPattern.key[0]} #$AS654D1C OK LMAOOOOO`,
                amount: 50,
            };
            const foundPattern =
                patternBank.findMatchingPatterns(testTransaction);
            expect(foundPattern).toEqual([testPattern]);
        });
    });

    describe("getAllKeys()", () => {
        test("should return an array with unique keys", () => {
            patternBank.patterns = [patternBank.patterns[0]];
            let keys = patternBank.patterns[0].key;
            expect(patternBank.getAllKeys()).toEqual(keys);
        });
        test("should return an array with unique keys", () => {
            let keySet = new Set();
            patternBank.patterns.forEach((p) => {
                p.key.forEach((k) => {
                    keySet.add(k);
                });
            });
            let keys = [...keySet];
            expect(patternBank.getAllKeys()).toEqual(keys);
        });
    });

    describe("getAllContents", () => {
        test("should return an array with all contents", () => {
            let contents = [];
            patternBank.patterns.forEach((p) => {
                contents.push(p["Contents"]);
            });

            expect(patternBank.getAllContents()).toEqual(contents);
        });
    });

    describe("getAllCategories()", () => {
        const isACategoryObj = (obj) => {
            const categoryObj = {
                category: "",
                subcategories: [],
            };
            let result = true;
            Object.keys(categoryObj).forEach((k) => {
                if (!obj.hasOwnProperty(k)) result = false;
            });
            return result;
        };
        const deepContains = (arr, obj) =>
            arr.filter((el) => equal(el, obj)).length > 0;

        test("should return an array", () => {
            expect(patternBank.getAllCategories()).toBeInstanceOf(Array);
        });
        test("should only contain category objects", () => {
            expect(patternBank.getAllCategories()).toSatisfyAll(isACategoryObj);
        });
        test("should contain unique objects", () => {
            let categories = patternBank.getAllCategories();
            expect(categories).toSatisfyAll((el) =>
                deepContains(categories, el)
            );
        });
        test("should return objects with valid categories", () => {
            expect(patternBank.getAllCategories()).toSatisfyAll((el) =>
                patternBank.patterns.find((p) => p["Main Cat."] === el.category)
            );
        });
        test("should return objects with valid subcategories", () => {
            expect(patternBank.getAllCategories()).toSatisfyAll((el) => {
                let result = true;
                el.subcategories.forEach((sub) => {
                    if (
                        !patternBank.patterns.find((p) => p["Sub Cat."] === sub)
                    )
                        result = false;
                });
                return result;
            });
        });
    });
});
