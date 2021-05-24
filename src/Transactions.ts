import { Pattern } from './util';

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

	initFromRawTransaction(
		rawTransaction: RawTransaction,
		pattern: Pattern
	): void {
		this['Date'] = rawTransaction.date;
		this['Main Cat.'] = pattern['Main Cat.'];
		this['Sub Cat.'] = pattern['Sub Cat.'];
		this['Contents'] = pattern['Contents'];
		this['Amount'] = Math.abs(rawTransaction.amount);
		this['Inc./Exp.'] = pattern['Inc./Exp.'];
		this['Details'] = pattern['Details'];
	}

	toTsvString(): string {
		let out = '';
		out += this['Date'] ? `${this['Date']}\t` : '\t';
		out += this['Account'] ? `${this['Account']}\t` : '\t';
		out += this['Main Cat.'] ? `${this['Main Cat.']}\t` : '\t';
		out += this['Sub Cat.'] ? `${this['Sub Cat.']}\t` : '\t';
		out += this['Contents'] ? `${this['Contents']}\t` : '\t';
		out += this['Amount'] ? `${this['Amount']}\t` : '\t';
		out += this['Inc./Exp.'] ? `${this['Inc./Exp.']}\t` : '\t';
		out += this['Details'] ? `${this['Details']}\t` : '\t';
		return out;
	}

	toString(): string {
		return JSON.stringify(this);
	}
}

export const parseTransactionCSV = (csvData: string): RawTransaction[] => {
	const ret: RawTransaction[] = new Array<RawTransaction>();
	const lines = csvData.split('\n');
	for (let i = 0; i < lines.length - 1; i++) {
		const lineElements = lines[i].split(',');
		const newTransaction: RawTransaction = {
			date: lineElements[0],
			desc: lineElements[1].substr(1, lineElements[1].length - 2),
			amount: Number.parseFloat(lineElements[2]),
		};
		ret.push(newTransaction);
	}
	return ret;
};
