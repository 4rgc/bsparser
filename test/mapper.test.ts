import Mapper from '../src/Utility/Mapper';
import { MeaningfulTransaction } from '../src/Transactions';
import { testRawTransaction } from './testutils';

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
});
