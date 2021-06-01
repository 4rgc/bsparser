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
