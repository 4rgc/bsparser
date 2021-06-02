import { RawTransaction } from '../Transactions';
import { ArgumentError } from './Errors';
import _ from 'lodash';

const FormattersEnum = Object.freeze({
	csv: (row: string): string[] => {
		return row
			.split(',')
			.map((el) =>
				typeof el === 'string' && el.charAt(0) === '"'
					? _.replace(
							el.substring(1, el.length - 1),
							new RegExp('""', 'g'),
							'"'
					  )
					: el
			);
	},
	tsv: (row: string): string[] => {
		return row.split('\t');
	},
});

export default class RawTransactionParser {
	static fromMultiline(
		data: string,
		format: string & keyof typeof FormattersEnum
	): RawTransaction[] {
		const rows = data.split('\n');
		const ret = [];
		for (const row of rows) {
			const props = FormattersEnum[format](row);
			const transaction = RawTransactionParser.buildObject(props);
			ret.push(transaction);
		}
		return ret;
	}

	private static buildObject(props: string[]) {
		if (
			/^(0?[1-9]|1[0-2])\/(0?[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/.test(
				props[0]
			) === false &&
			isNaN(Date.parse(props[0]))
		)
			throw new ArgumentError('must be a valid date following MM/DD/YY');

		if (isNaN(Number.parseFloat(props[2])))
			throw new ArgumentError('must be a valid number');

		const transaction = {
			date: props[0],
			desc: props[1],
			amount: Number.parseFloat(props[2]),
		};
		return transaction;
	}
}
