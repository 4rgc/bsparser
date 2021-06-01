import { Stringify } from '../src/Stringify';
import { MeaningfulTransaction } from '../src/Transactions';
import { testMeaningfulTransaction, tsvTransactionOrder } from './testutils';

describe('Stringify', () => {
	test('MeaningfulTransaction()', () => {
		const mt = testMeaningfulTransaction;
		const tsvMt = Stringify.MeaningfulTransaction('tsv', mt);
		const splitTsvMt = tsvMt.split('\t');

		for (let i = 0; i < tsvTransactionOrder.length; i++) {
			const orderElem = tsvTransactionOrder[
				i
			] as keyof MeaningfulTransaction;
			const prop = mt[orderElem];
			expect(splitTsvMt[i]).toBe(prop?.toString());
		}
	});
});
