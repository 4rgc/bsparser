export type RawTransaction = { date: string; desc: string; amount: number };

export class MeaningfulTransaction {
	'Date': string;
	'Account': string;
	'Main Cat.': string;
	'Sub Cat.': string | undefined;
	'Contents': string;
	'Amount': number;
	'Inc./Exp.': string;
	'Details': string | undefined;

	constructor(account: string) {
		this['Account'] = account;
	}
}
