import PatternBank from '../src/Patterns/PatternBank';
import { readFileAsText } from '../src/util';
import fs from 'fs';
import { testPatterns } from './testutils';
import equal from 'deep-equal';

jest.mock('../src/util');
jest.mock('fs');

describe('TransactionPatterns', () => {
	const origPatternBank = PatternBank;
	let patternBank: typeof PatternBank;

	beforeEach(() => {
		patternBank = Object.create(origPatternBank);
		Object.assign(patternBank, origPatternBank);
		patternBank.patterns = [...testPatterns];
	});

	describe('loadPatterns()', () => {
		let path: string;

		beforeAll(() => {
			(readFileAsText as jest.Mock).mockImplementation(
				jest.fn((p) => `file contents at ${p}`)
			);
			JSON.parse = jest.fn();
		});
		afterAll(() => {
			jest.unmock('../src/util');
		});
		beforeEach(() => {
			path = patternBank.diskRelPath;
			patternBank.loadPatterns();
		});
		afterEach(() => {
			jest.clearAllMocks();
		});

		test('should call readFileAsText', () => {
			expect(readFileAsText).toBeCalledTimes(1);
		});

		test('should call JSON.parse with file contents', () => {
			expect(JSON.parse).toBeCalledTimes(1);
			expect(JSON.parse).toBeCalledWith(`file contents at ${path}`);
		});
	});

	describe('savePatterns()', () => {
		let path: string;
		let mockWriteFile: jest.SpyInstance;
		beforeAll(() => {
			mockWriteFile = jest.spyOn(fs, 'writeFile');
			mockWriteFile.mockImplementation(jest.fn());
		});
		beforeEach(() => {
			path = patternBank.diskRelPath;
			patternBank.patterns = [
				{
					key: [''],
					Contents: path,
					'Main Cat.': 'cat',
					'Inc./Exp.': 'inc',
				},
			];
			patternBank.savePatterns();
		});
		afterEach(() => {
			jest.clearAllMocks();
		});
		afterAll(() => {
			jest.unmock('fs');
		});
		test('should call fs.writeFile with the stringified patterns', () => {
			expect(mockWriteFile).toBeCalledTimes(1);
			expect(mockWriteFile.mock.calls[0][0]).toBe(
				patternBank.diskRelPath
			);
			expect(mockWriteFile.mock.calls[0][1]).toBe(
				JSON.stringify(patternBank.patterns)
			);
		});
	});

	describe('addPattern()', () => {
		test('should add the pattern to the inside array', () => {
			const newPattern = {
				key: ['okokok'],
				Contents: 'cont',
				'Main Cat.': 'cat',
				'Inc./Exp.': 'inc',
			};
			const prevPatterns = [...patternBank.patterns];
			patternBank.addPattern(newPattern);
			expect(patternBank.patterns).toEqual([...prevPatterns, newPattern]);
		});
	});

	describe('findMatchingPatterns()', () => {
		test('should return a matching pattern object', () => {
			const testPattern = testPatterns[0];
			const testTransaction = {
				date: '01/01/1970',
				desc: `${testPattern.key[0]} #$AS654D1C OK LMAOOOOO`,
				amount: 50,
			};
			const foundPattern =
				patternBank.findMatchingPatterns(testTransaction);
			expect(foundPattern).toEqual([testPattern]);
		});
	});

	describe('getAllKeys()', () => {
		test('should return an array with unique keys', () => {
			patternBank.patterns = [patternBank.patterns[0]];
			const keys = patternBank.patterns[0].key;
			expect(patternBank.getAllKeys()).toEqual(keys);
		});
		test('should return an array with unique keys', () => {
			const keySet = new Set();
			patternBank.patterns.forEach((p) => {
				p.key.forEach((k) => {
					keySet.add(k);
				});
			});
			const keys = [...keySet];
			expect(patternBank.getAllKeys()).toEqual(keys);
		});
	});

	describe('getAllContents', () => {
		test('should return an array with all contents', () => {
			const contents: string[] = [];
			patternBank.patterns.forEach((p) => {
				contents.push(p['Contents']);
			});

			expect(patternBank.getAllContents()).toEqual(contents);
		});
	});

	describe('getAllCategories()', () => {
		const isACategoryObj = (obj: unknown) => {
			const categoryObj = {
				category: '',
				subcategories: [],
			};
			let result = true;
			Object.keys(categoryObj).forEach((k) => {
				if (!Object.prototype.hasOwnProperty.call(obj, k))
					result = false;
			});
			return result;
		};
		const deepContains = (arr: unknown[], obj: unknown) =>
			arr.filter((el) => equal(el, obj)).length > 0;

		test('should return an array', () => {
			expect(patternBank.getAllCategories()).toBeInstanceOf(Array);
		});
		test('should only contain category objects', () => {
			expect(patternBank.getAllCategories()).toSatisfyAll(isACategoryObj);
		});
		test('should contain unique objects', () => {
			const categories = patternBank.getAllCategories();
			expect(categories).toSatisfyAll((el) =>
				deepContains(categories, el)
			);
		});
		test('should return objects with valid categories', () => {
			expect(patternBank.getAllCategories()).toSatisfyAll(
				(el) =>
					patternBank.patterns.find(
						(p) => p['Main Cat.'] === el.category
					) !== undefined
			);
		});
		test('should return objects with valid subcategories', () => {
			expect(patternBank.getAllCategories()).toSatisfyAll((el) => {
				let result = true;
				el.subcategories.forEach((sub: string) => {
					if (
						!patternBank.patterns.find((p) => p['Sub Cat.'] === sub)
					)
						result = false;
				});
				return result;
			});
		});
	});

	describe('appendKeyToPattern()', () => {
		test('should add a key to a pattern', () => {
			const pattern = patternBank.patterns[0];
			const newKey = 'abcd1234';
			const newKeys = [...pattern.key, newKey];

			patternBank.appendKeyToPattern(newKey, pattern['Contents']);
			expect(pattern.key).toEqual(newKeys);
		});
	});
});
