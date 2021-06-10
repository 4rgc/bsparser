import Mapper from '../Utility/Mapper';
import { MeaningfulTransaction } from '../Utility/Transactions';
import { testPattern, testRawTransaction } from './testutils';
import patterns from '../Patterns/PatternBank';
import {
	ResolvedPattern,
	UnresolvedPattern,
} from '../Patterns/PatternResolver';
import { MultipleMatchingPatternsFoundError } from '../Utility/Errors';

describe('Mapper', () => {
	describe('MeaningfulTransactionFromRawTransaction()', () => {
		const testPattern = {
			key: ['test'],
			'Main Cat.': 'Cat',
			'Sub Cat.': 'Subcat',
			Contents: 'Test',
			'Inc./Exp.': 'Exp',
			Details: '',
		};

		const account = 'credit';

		beforeAll(() => {
			Mapper.MeaningfulTransactionFromRawTransaction = jest.fn(
				Mapper.MeaningfulTransactionFromRawTransaction
			);
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		test('should return a MeaningfulTransaction', () => {
			expect(
				Mapper.MeaningfulTransactionFromRawTransaction(
					testRawTransaction,
					account,
					testPattern
				)
			).toBeInstanceOf(MeaningfulTransaction);
		});

		test('should return a valid MeaningfulTransaction', () => {
			const mt = Mapper.MeaningfulTransactionFromRawTransaction(
				testRawTransaction,
				account,
				testPattern
			);

			expect(mt.Account).toBe('credit');
			expect(mt.Amount).toBe(testRawTransaction.amount);
			expect(mt.Contents).toBe(testPattern.Contents);
			expect(mt.Date).toBe(testRawTransaction.date);
			expect(mt.Details).toBe(testPattern['Details']);
			expect(mt['Inc./Exp.']).toBe(testPattern['Inc./Exp.']);
			expect(mt['Main Cat.']).toBe(testPattern['Main Cat.']);
			expect(mt['Sub Cat.']).toBe(testPattern['Sub Cat.']);
		});
	});

	describe('RawTransactionToMatchingPattern()', () => {
		test('should return a resolved pattern', () => {
			patterns.findMatchingPatterns = jest.fn(() => [testPattern]);

			expect(
				Mapper.RawTransactionToMatchingPattern(testRawTransaction)
			).toBeInstanceOf(ResolvedPattern);
		});

		test('should return an unresolved pattern', () => {
			patterns.findMatchingPatterns = jest.fn(() => []);

			expect(
				Mapper.RawTransactionToMatchingPattern(testRawTransaction)
			).toBeInstanceOf(UnresolvedPattern);
		});

		test('should throw MultipleMatchingPatternsFoundError', () => {
			patterns.findMatchingPatterns = jest.fn(() => [
				testPattern,
				testPattern,
			]);

			expect(() =>
				Mapper.RawTransactionToMatchingPattern(testRawTransaction)
			).toThrow(MultipleMatchingPatternsFoundError);
		});
	});
});
