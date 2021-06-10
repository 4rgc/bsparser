import PatternBank from '../Patterns/PatternBank';
import fs from 'fs';
import { testPatterns } from './testutils';
import equal from 'deep-equal';
import Pattern from '../Patterns/Pattern';
import { readFileAsText } from '../Utility/util';
jest.mock('../Utility/util', () => ({
	...jest.requireActual('../Utility/util'),
	readFileAsText: jest.fn(),
}));

describe('PatternBank', () => {
	const origPatternBank = PatternBank;
	let patternBank: typeof PatternBank;

	beforeEach(() => {
		patternBank = Object.create(origPatternBank);
		Object.assign(patternBank, origPatternBank);
		patternBank.patterns = [...testPatterns];
	});
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('loadPatterns()', () => {
		let patterns: string;

		beforeAll(() => {
			(readFileAsText as jest.Mock).mockImplementation((p) => {
				if (p === patternBank.diskRelPath) {
					return patterns;
				}
				return 'a';
			});
		});
		beforeEach(() => {
			patterns =
				'[{"key": ["test", "TST"],"Contents": "Test","Main Cat.": "testcat","Sub Cat.": "subcat","Inc./Exp.": "支出"}]';
			patternBank.loadPatterns();
		});

		test('should set patterns prop to an array', () => {
			expect(patternBank.patterns).toBeArray();
		});

		test('should add Pattern to the patterns array', () => {
			expect(patternBank.patterns[0]).toBeInstanceOf(Pattern);
		});

		test('should add multiple Patterns to the patterns array', () => {
			patterns = JSON.stringify(testPatterns);
			patternBank.loadPatterns();

			for (const pattern of patternBank.patterns) {
				expect(pattern).toBeInstanceOf(Pattern);
			}
		});

		test('should read patterns from diskRelPath', () => {
			expect(patternBank.patterns).toEqual([testPatterns[0]]);
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
				Object.assign(new Pattern(), {
					key: [''],
					Contents: path,
					'Main Cat.': 'cat',
					'Inc./Exp.': 'inc',
				}),
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
			const newPattern = Object.assign(new Pattern(), {
				key: ['okokok'],
				Contents: 'cont',
				'Main Cat.': 'cat',
				'Inc./Exp.': 'inc',
			});
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

		test('should throw if no pattern found', () => {
			const newKey = 'abcd1234';

			expect(() =>
				patternBank.appendKeyToPattern(newKey, 'randomstring')
			).toThrow();
		});
	});

	describe('findByDescription()', () => {
		test('should return a matching pattern', () => {
			const description = 'Test1';
			expect(patternBank.findByDescription(description)).toBe(
				testPatterns[1]
			);
		});

		test('should return undefined if no pattern is found', () => {
			const description = 'TestTest';
			expect(patternBank.findByDescription(description)).toBe(undefined);
		});
	});
});
