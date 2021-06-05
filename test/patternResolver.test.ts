import { promptCreateOrAppendToPattern } from '../src/Console/PatternResolution';
import PatternResolver, {
	ResolvedPattern,
	UnresolvedPattern,
} from '../src/Patterns/PatternResolver';
import { promptNewPattern, promptPatternKey } from '../src/Console/NewPattern';
import { testPattern, testRawTransaction } from './testutils';
import PatternBank from '../src/Patterns/PatternBank';
import Pattern from '../src/Patterns/Pattern';

jest.mock('../src/Console/NewPattern');
jest.mock('../src/Console/PatternResolution');
jest.mock('../src/Patterns/PatternBank');

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
			beforeAll(() => {
				(promptCreateOrAppendToPattern as jest.Mock).mockReturnValue(2);
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
		});
	});
});
