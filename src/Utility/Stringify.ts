import { MeaningfulTransaction } from '../Transactions';
import { FormatterError } from './Errors';
import _ from 'lodash';

const FormattersEnum = Object.freeze({
	csv: (arr: unknown[]) =>
		arr
			.map((el) => {
				if (el) {
					let ret;
					if (typeof el === 'string') {
						if (/[",]+/.test(el)) ret = el;
						else return el;
					} else if (/[",]+/.test(JSON.stringify(el)))
						ret = JSON.stringify(el);
					else return JSON.stringify(el);

					return `"${_.replace(ret, /"/g, '""')}"`;
				}
				return el;
			})
			.join(','),
	tsv: (arr: unknown[]) =>
		arr
			.map((el) => {
				if (!el) return '';
				if (JSON.stringify(el).includes('\\t'))
					throw new FormatterError('\\t not expected');
				return el;
			})
			.join('\t'),
});

export const AvailableFormatters = Object.freeze(Object.keys(FormattersEnum));

export class Stringify {
	static MeaningfulTransaction(
		using: keyof typeof FormattersEnum,
		meaningfulTransaction: MeaningfulTransaction
	): string {
		const order: (keyof MeaningfulTransaction)[] = [
			'Date',
			'Account',
			'Main Cat.',
			'Sub Cat.',
			'Contents',
			'Amount',
			'Inc./Exp.',
			'Details',
		];

		const valArr = new Array<string | number | undefined>();

		for (const k of order) {
			const val = meaningfulTransaction[k];
			valArr.push(val);
		}

		return FormattersEnum[using](valArr);
	}
}
