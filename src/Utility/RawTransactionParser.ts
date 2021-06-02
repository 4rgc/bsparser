import { RawTransaction } from '../Transactions';
import { ArgumentError } from './Errors';

export default class RawTransactionParser {
	static fromCSV(data: string): RawTransaction {
		const props = data.split(',');

		if (
			/^(0?[1-9]|1[0-2])\/(0?[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/.test(
				props[0]
			) === false &&
			isNaN(Date.parse(props[0]))
		)
			throw new ArgumentError('must be a valid date following MM/DD/YY');

		return {
			date: props[0],
			desc: props[1],
			amount: Number.parseInt(props[2]),
		};
	}
}
