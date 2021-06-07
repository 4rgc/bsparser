import { Stringify } from '../src/Utility/Stringify';
import { MeaningfulTransaction } from '../src/Transactions';
import {
	testMeaningfulTransaction,
	MeaningfulTransactionOrder,
} from './testutils';
import { FormatterError } from '../src/Utility/Errors';
import parse from 'csv-parse/lib/sync';

describe('Stringify', () => {
	describe('MeaningfulTransaction()', () => {
		let mt: MeaningfulTransaction;

		beforeEach(() => {
			mt = Object.assign({}, testMeaningfulTransaction);
		});

		describe('csv', () => {
			test('should return a proper string', () => {
				const csvMt = Stringify.MeaningfulTransaction('csv', mt);
				const splitCsvMt = parse(csvMt)[0];

				for (let i = 0; i < MeaningfulTransactionOrder.length; i++) {
					const orderElem = MeaningfulTransactionOrder[
						i
					] as keyof MeaningfulTransaction;
					const prop = mt[orderElem];
					expect(splitCsvMt[i]).toBe(prop?.toString());
				}
			});

			test('should replace undefined fields with ""', () => {
				mt.Details = undefined;
				const csvMt = Stringify.MeaningfulTransaction('csv', mt);
				const splitCsvMt = parse(csvMt)[0];

				const undefIndex =
					MeaningfulTransactionOrder.indexOf('Details');
				expect(mt[MeaningfulTransactionOrder[undefIndex]]).toBe(
					undefined
				);
				expect(splitCsvMt[undefIndex]).toBe('');
			});

			test('should wrap Contents prop in double quotes', () => {
				const testContents = 'The BRUH, store';
				mt.Contents = testContents;
				const csvMt = Stringify.MeaningfulTransaction('csv', mt);
				const splitCsvMt = parse(csvMt)[0];

				const contentsIdx =
					MeaningfulTransactionOrder.indexOf('Contents');

				expect(mt[MeaningfulTransactionOrder[contentsIdx]]).toBe(
					testContents
				);
				console.log(splitCsvMt);
				expect(splitCsvMt[contentsIdx]).toBe('The BRUH, store');
			});

			test('should wrap and replace inner double quotes with 2 of those', () => {
				const testContents = 'The "BRUH" store';
				mt.Contents = testContents;
				const csvMt = Stringify.MeaningfulTransaction('csv', mt);
				const splitCsvMt = parse(csvMt)[0];

				const contentsIdx =
					MeaningfulTransactionOrder.indexOf('Contents');

				expect(mt[MeaningfulTransactionOrder[contentsIdx]]).toBe(
					testContents
				);
				expect(splitCsvMt[contentsIdx]).toBe('The "BRUH" store');
			});
		});

		describe('tsv', () => {
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

				const undefIndex =
					MeaningfulTransactionOrder.indexOf('Details');
				expect(mt[MeaningfulTransactionOrder[undefIndex]]).toBe(
					undefined
				);
				expect(splitTsvMt[undefIndex]).toBe('');
			});

			test('should throw on field containing \\t', () => {
				mt['Main Cat.'] += '\t';
				expect(() =>
					Stringify.MeaningfulTransaction('tsv', mt)
				).toThrow(FormatterError);
			});
		});
	});
});
