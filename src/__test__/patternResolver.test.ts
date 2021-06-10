import { promptCreateOrAppendToPattern } from '../Console/PatternResolution';
import PatternResolver, {
	ResolvedPattern,
	UnresolvedPattern,
} from '../Patterns/PatternResolver';
import { promptNewPattern, promptPatternKey } from '../Console/NewPattern';
import { testPattern, testPatterns, testRawTransaction } from './testutils';
import PatternBank from '../Patterns/PatternBank';
import Pattern from '../Patterns/Pattern';

jest.mock('../Console/NewPattern');
jest.mock('../Console/PatternResolution');
jest.mock('../Patterns/PatternBank');

describe('PatternResolver', () => {
	let pattern: Pattern = testPattern;
	beforeEach(() => {
		pattern = testPattern;
	});
	afterEach(() => {
		jest.clearAllMocks();
	});
	describe('resolve()', () => {
		const newKey = 'abcd1234';
		beforeAll(() => {
			(promptPatternKey as jest.Mock).mockReturnValue(newKey);
			(promptNewPattern as jest.Mock).mockReturnValue(pattern);
		});

		describe('create new pattern', () => {
			beforeAll(() => {
				(promptCreateOrAppendToPattern as jest.Mock).mockReturnValue(1);
				(PatternBank.getAllCategories as jest.Mock).mockReturnValue([]);
			});
			test('should return a ResolvedPattern', async () => {
				expect(
					await PatternResolver.resolve(
						new UnresolvedPattern(testRawTransaction)
					)
				).toBeInstanceOf(ResolvedPattern);
			});

			test('should return a proper resolved pattern', async () => {
				expect(
					await PatternResolver.resolve(
						new UnresolvedPattern(testRawTransaction)
					)
				).toEqual(new ResolvedPattern(pattern));
			});
		});

		describe('append to pattern', () => {
			let mockPromptCreateOrAppendToPattern: jest.Mock;

			beforeAll(() => {
				mockPromptCreateOrAppendToPattern = (
					promptCreateOrAppendToPattern as jest.Mock
				).mockReturnValue(2);
				(PatternBank.findMatchingPatterns as jest.Mock).mockReturnValue(
					[]
				);
				(PatternBank.findByDescription as jest.Mock).mockReturnValue(
					pattern
				);
			});

			test('should return a ResolvedPattern', async () => {
				expect(
					await PatternResolver.resolve(
						new UnresolvedPattern(testRawTransaction)
					)
				).toBeInstanceOf(ResolvedPattern);
			});

			test('should return a proper resolved pattern', async () => {
				expect(
					await PatternResolver.resolve(
						new UnresolvedPattern(testRawTransaction)
					)
				).toEqual(new ResolvedPattern(pattern));
			});

			test('should return a pattern with new key appended', async () => {
				pattern.key.push(newKey);

				expect(
					(
						await PatternResolver.resolve(
							new UnresolvedPattern(testRawTransaction)
						)
					).key
				).toContain(newKey);
			});

			test('should throw "patternToAppend was null"', async () => {
				(PatternBank.findByDescription as jest.Mock).mockReturnValue(
					undefined
				);

				await expect(() =>
					PatternResolver.resolve(
						new UnresolvedPattern(testRawTransaction)
					)
				).rejects.toThrow('patternToAppend was null');
			});

			test('should throw "unexpected choice value received"', async () => {
				let val = 5000;
				mockPromptCreateOrAppendToPattern.mockImplementation(
					async () => val
				);

				await expect(
					PatternResolver.resolve(
						new UnresolvedPattern(testRawTransaction)
					)
				).rejects.toThrow('unexpected choice value received');

				val = -123;
				await expect(
					PatternResolver.resolve(
						new UnresolvedPattern(testRawTransaction)
					)
				).rejects.toThrow('unexpected choice value received');

				val = 1.2356;
				await expect(
					PatternResolver.resolve(
						new UnresolvedPattern(testRawTransaction)
					)
				).rejects.toThrow('unexpected choice value received');
			});
		});

		describe('resolveAll()', () => {
			let testUnresolvedPatterns: UnresolvedPattern[];

			beforeAll(() => {
				const resolveGenFun = function* lambda(): Generator<
					ResolvedPattern,
					void,
					void
				> {
					for (const pattern of testPatterns) {
						yield new ResolvedPattern(pattern);
					}
				};
				let curGen = resolveGenFun();
				jest.spyOn(PatternResolver, 'resolve').mockImplementation(
					async () => {
						const val = curGen.next().value;
						if (val) return val;
						else {
							curGen = resolveGenFun();
							return (
								curGen.next().value ||
								new ResolvedPattern(testPattern)
							);
						}
					}
				);
			});

			beforeEach(() => {
				testUnresolvedPatterns = [
					new UnresolvedPattern(testRawTransaction),
					new UnresolvedPattern(testRawTransaction),
					new UnresolvedPattern(testRawTransaction),
				];
			});

			test('should return an array', async () => {
				expect(
					await PatternResolver.resolveAll(testUnresolvedPatterns)
				).toBeArray();
			});

			test('should return an array with ResolvedPattern objects', async () => {
				const result = await PatternResolver.resolveAll(
					testUnresolvedPatterns
				);

				for (const el of result)
					expect(el).toBeInstanceOf(ResolvedPattern);
			});
		});
	});
});
