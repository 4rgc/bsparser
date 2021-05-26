import { MeaningfulTransaction } from '../src/Transactions';
import { testMeaningfulTransaction, tsvTransactionOrder } from './testutils';

describe('MeaningfulTransaction', () => {
	test('toTsvString', () => {
		const mt = testMeaningfulTransaction;
		const tsvMt = mt.toTsvString();
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
