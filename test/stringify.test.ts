import { Stringify } from '../src/Utility/Stringify';
import { MeaningfulTransaction } from '../src/Transactions';
import {
	testMeaningfulTransaction,
	MeaningfulTransactionOrder,
} from './testutils';
import { FormatterError } from '../src/Utility/Errors';

describe('Stringify', () => {
	describe('MeaningfulTransaction()', () => {
		let mt: MeaningfulTransaction;

		beforeEach(() => {
			mt = Object.assign({}, testMeaningfulTransaction);
		});

		test('should return a proper string', () => {
			const tsvMt = Stringify.MeaningfulTransaction('tsv', mt);
			const splitTsvMt = tsvMt.split('\t');

			for (let i = 0; i < MeaningfulTransactionOrder.length; i++) {
				const orderElem = MeaningfulTransactionOrder[
					i
				] as keyof MeaningfulTransaction;
				const prop = mt[orderElem];
				expect(splitTsvMt[i]).toBe(prop?.toString());
			}
		});

		test('should replace undefined fields with ""', () => {
			mt.Details = undefined;
			const tsvMt = Stringify.MeaningfulTransaction('tsv', mt);
			const splitTsvMt = tsvMt.split('\t');

			const undefIndex = MeaningfulTransactionOrder.indexOf('Details');
			expect(mt[MeaningfulTransactionOrder[undefIndex]]).toBe(undefined);
			expect(splitTsvMt[undefIndex]).toBe('');
		});

		test('should throw on field containing \\t', () => {
			mt['Main Cat.'] += '\t';
			expect(() => Stringify.MeaningfulTransaction('tsv', mt)).toThrow(
				FormatterError
			);
		});
	});
});
