import moment from 'moment';
import { ArgumentError } from '../src/Utility/Errors';
import RawTransactionParser from '../src/Utility/RawTransactionParser';
import { testRawTransaction } from './testutils';

describe('RawTransactionParser', () => {
	describe('fromMultiline()', () => {
		describe('using csv', () => {
			const testRow = `12/24/2021,"DOMINOS PIZZA  10754     BROOKLYN   NY ",-24.98`,
				testDoubleQuoteRow = `12/24/2021,"DOMINOS PIZZA  10754     ""BROOKLYN""   NY ",-24.98`,
				testRowWithEmpty = `12/24/2021,"DOMINOS PIZZA  10754     BROOKLYN   NY ",-24.98\n\n\n`,
				testThrowRow1 = `13/1/2021,"DOMINOS PIZZA  10754     BROOKLYN   NY ",-24.98`,
				testThrowRow2 = `12/40/2021,"DOMINOS PIZZA  10754     BROOKLYN   NY ",-24.98`,
				testThrowRow3 = `,"DOMINOS PIZZA  10754     BROOKLYN   NY ",-24.98`,
				testThrowRow4 = `12/40,"DOMINOS PIZZA  10754     BROOKLYN   NY ",-24.98`,
				testThrowRow5 = `12/40/2021,"DOMINOS PIZZA  10754     BROOKLYN   NY ",-2.12fq451`,
				testThrowRow6 = `12/40/2021,"DOMINOS PIZZA  10754     BROOKLYN   NY ",hello i'm text`,
				testThrowRow7 = `12/40/2021,"DOMINOS PIZZA  10754     BROOKLYN   NY ",`,
				testThrowRow8 = `12/40/2021,"DOMINOS PIZZA  10754     BROOKLYN   NY ",NaN`;

			test('should return a RawTransaction array', () => {
				const result = RawTransactionParser.fromMultiline(
					testRow,
					'csv'
				);
				expect(result).toBeArray();
				for (const k of Object.keys(testRawTransaction))
					expect(result[0]).toHaveProperty(k);
			});

			test('should return an object with a proper date prop', () => {
				const date = RawTransactionParser.fromMultiline(
					testRow,
					'csv'
				)[0].date;
				expect(date).toMatch(
					/^(0?[1-9]|1[0-2])\/(0?[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/
				);
				expect(moment(date, 'MM/DD/YYYY').toDate()).toBeValidDate();
			});

			test('should remove wrapping double quotes from desc prop', () => {
				const desc = RawTransactionParser.fromMultiline(
					testRow,
					'csv'
				)[0].desc;

				expect(desc.charAt(0)).not.toBe('"');
			});

			test('should replace inner double-quote pairs to single ones', () => {
				const desc = RawTransactionParser.fromMultiline(
					testDoubleQuoteRow,
					'csv'
				)[0].desc;

				expect(desc[desc.indexOf('BROOKLYN') - 2]).not.toBe('"');
			});

			test('should return one object', () => {
				const result = RawTransactionParser.fromMultiline(
					testRowWithEmpty,
					'csv'
				);
				expect(result).toBeArray();
				expect(result).toBeArrayOfSize(1);
			});

			test('should throw on invalid date', () => {
				expect(() =>
					RawTransactionParser.fromMultiline(testThrowRow1, 'csv')
				).toThrow(ArgumentError);

				expect(() =>
					RawTransactionParser.fromMultiline(testThrowRow2, 'csv')
				).toThrow(ArgumentError);

				expect(() =>
					RawTransactionParser.fromMultiline(testThrowRow3, 'csv')
				).toThrow(ArgumentError);

				expect(() =>
					RawTransactionParser.fromMultiline(testThrowRow4, 'csv')
				).toThrow(ArgumentError);
			});

			test('should throw on invalid amount', () => {
				expect(() => {
					RawTransactionParser.fromMultiline(testThrowRow5, 'csv');
				}).toThrow(ArgumentError);

				expect(() => {
					RawTransactionParser.fromMultiline(testThrowRow6, 'csv');
				}).toThrow(ArgumentError);

				expect(() => {
					RawTransactionParser.fromMultiline(testThrowRow7, 'csv');
				}).toThrow(ArgumentError);

				expect(() => {
					RawTransactionParser.fromMultiline(testThrowRow8, 'csv');
				}).toThrow(ArgumentError);
			});
		});

		describe('using tsv', () => {
			const testRow = `12/24/2021\tDOMINOS PIZZA  10754     BROOKLYN   NY \t-24.98`,
				testRowWithEmpty = `12/24/2021\tDOMINOS PIZZA  10754     BROOKLYN   NY \t-24.98\n\n\n`,
				testThrowRow1 = `13/1/2021\tDOMINOS PIZZA  10754     BROOKLYN   NY \t-24.98`,
				testThrowRow2 = `12/40/2021\tDOMINOS PIZZA  10754     BROOKLYN   NY \t-24.98`,
				testThrowRow3 = `\tDOMINOS PIZZA  10754     BROOKLYN   NY \t-24.98`,
				testThrowRow4 = `12/40\tDOMINOS PIZZA  10754     BROOKLYN   NY \t-24.98`,
				testThrowRow5 = `12/40/2021\tDOMINOS PIZZA  10754     BROOKLYN   NY \t-2.12fq451`,
				testThrowRow6 = `12/40/2021\tDOMINOS PIZZA  10754     BROOKLYN   NY \thello i'm text`,
				testThrowRow7 = `12/40/2021\tDOMINOS PIZZA  10754     BROOKLYN   NY \t`,
				testThrowRow8 = `12/40/2021\tDOMINOS PIZZA  10754     BROOKLYN   NY \tNaN`;

			test('should return a RawTransaction array', () => {
				const result = RawTransactionParser.fromMultiline(
					testRow,
					'tsv'
				);
				expect(result).toBeArray();
				for (const k of Object.keys(testRawTransaction))
					expect(result[0]).toHaveProperty(k);
			});

			test('should return an object with a proper date prop', () => {
				const date = RawTransactionParser.fromMultiline(
					testRow,
					'tsv'
				)[0].date;
				expect(date).toMatch(
					/^(0?[1-9]|1[0-2])\/(0?[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/
				);
				expect(moment(date, 'MM/DD/YYYY').toDate()).toBeValidDate();
			});

			test('should return one object', () => {
				const result = RawTransactionParser.fromMultiline(
					testRowWithEmpty,
					'tsv'
				);
				expect(result).toBeArray();
				expect(result).toBeArrayOfSize(1);
			});

			test('should throw on invalid date', () => {
				expect(() =>
					RawTransactionParser.fromMultiline(testThrowRow1, 'tsv')
				).toThrow(ArgumentError);

				expect(() =>
					RawTransactionParser.fromMultiline(testThrowRow2, 'tsv')
				).toThrow(ArgumentError);

				expect(() =>
					RawTransactionParser.fromMultiline(testThrowRow3, 'tsv')
				).toThrow(ArgumentError);

				expect(() =>
					RawTransactionParser.fromMultiline(testThrowRow4, 'tsv')
				).toThrow(ArgumentError);
			});

			test('should throw on invalid amount', () => {
				expect(() => {
					RawTransactionParser.fromMultiline(testThrowRow5, 'tsv');
				}).toThrow(ArgumentError);

				expect(() => {
					RawTransactionParser.fromMultiline(testThrowRow6, 'tsv');
				}).toThrow(ArgumentError);

				expect(() => {
					RawTransactionParser.fromMultiline(testThrowRow7, 'tsv');
				}).toThrow(ArgumentError);

				expect(() => {
					RawTransactionParser.fromMultiline(testThrowRow8, 'tsv');
				}).toThrow(ArgumentError);
			});
		});
	});
});
