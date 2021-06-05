import { MeaningfulTransaction } from '../Transactions';

const FormattersEnum = Object.freeze({
	csv: (arr: unknown[]) =>
		arr
			.map((el) => {
				return el
					? typeof el === 'string' ||
							(JSON.stringify(el).includes(',') ? `"${el}"` : el)
					: '';
			})
			.join(','),
	tsv: (arr: unknown[]) =>
		arr
			.map((el) =>
				el ? (JSON.stringify(el).includes('\t') ? `"${el}"` : el) : ''
			)
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
