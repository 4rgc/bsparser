import { TransactionPatterns } from "../src/TransactionPatterns";
import { readFileAsText } from "../src/util";
import { writeFile } from "fs";

jest.mock("../src/util");
jest.mock("fs");

describe("TransactionPatterns", () => {
    describe("loadPatterns()", () => {
        let path;
        let patterns;
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
            path = "path";
            patterns = new TransactionPatterns(path);
            patterns.loadPatterns();
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
        let patterns;
        beforeAll(() => {
            writeFile.mockImplementation(jest.fn());
        });
        beforeEach(() => {
            path = "path";
            patterns = new TransactionPatterns(path);
            patterns.patterns = {
                path,
                prop2: 1,
            };
            patterns.savePatterns();
        });
        afterEach(() => {
            jest.clearAllMocks();
        });
        afterAll(() => {
            jest.unmock(fs);
        });
        test("should call fs.writeFile with the stringified patterns", () => {
            expect(writeFile).toBeCalledTimes(1);
            expect(writeFile.mock.calls[0][0]).toBe(patterns.diskRelPath);
            expect(writeFile.mock.calls[0][1]).toBe(
                JSON.stringify(patterns.patterns)
            );
        });
    });

    describe("addPattern()", () => {
        let patterns;
        beforeEach(() => {
            patterns = new TransactionPatterns("path");
        });
        test("should add the pattern to the inside array", () => {
            const newPattern = { name: "a", lmao: "b" };
            const prevPatterns = [...patterns.patterns];
            patterns.addPattern(newPattern);
            expect(patterns.patterns).toEqual([...prevPatterns, newPattern]);
        });
    });
});
