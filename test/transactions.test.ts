import { MeaningfulTransaction } from '../src/Transactions';
import {
	testPattern,
	testRawTransaction,
	testMeaningfulTransaction,
	tsvTransactionOrder,
} from './testutils';

describe('MeaningfulTransaction', () => {
	test('initFromRawTransaction', () => {
		const mt = new MeaningfulTransaction('credit');
		const rt = testRawTransaction;

		mt.initFromRawTransaction(rt, testPattern);

		expect(mt.Account).toBe('credit');
		expect(mt.Amount).toBe(rt.amount);
		expect(mt.Contents).toBe(testPattern.Contents);
		expect(mt.Date).toBe(rt.date);
		expect(mt.Details).toBe(testPattern['Details']);
		expect(mt['Inc./Exp.']).toBe(testPattern['Inc./Exp.']);
		expect(mt['Main Cat.']).toBe(testPattern['Main Cat.']);
		expect(mt['Sub Cat.']).toBe(testPattern['Sub Cat.']);
	});

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
