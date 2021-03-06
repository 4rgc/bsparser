import fs from 'fs';
import { MeaningfulTransaction, RawTransaction } from './Transactions';
import PatternBank from './Patterns/PatternBank';
import { readFileAsText } from './util';
import moment from 'moment';
import { promptSettings, SettingsProps } from './Console/Settings';
import Mapper from './Utility/Mapper';
import { Pattern } from './types';
import PatternResolver, {
	ResolvedPattern,
	UnresolvedPattern,
} from './Patterns/PatternResolver';
import { Stringify } from './Utility/Stringify';
import RawTransactionParser from './Utility/RawTransactionParser';

class App {
	patterns: typeof PatternBank;
	account: string;
	transactions: RawTransaction[];

	constructor() {
		this.patterns = PatternBank;
		this.patterns.loadPatterns();
		this.account = '';
		this.transactions = new Array<RawTransaction>();
	}

	async run(): Promise<void> {
		const promptReceivedPromise = promptSettings();

		promptReceivedPromise.then(async (result: SettingsProps) => {
			this.account =
				Number.parseInt(result.creditDebit) == 1
					? 'クレジットカード'
					: 'デビットカード';

			const CSVData = readFileAsText(result.path);
			this.transactions = RawTransactionParser.fromMultiline(
				CSVData,
				'csv'
			);
			this.removeTransactionsBefore(result.dateBefore);

			const mappedPatterns =
				await this.mapTransactionsToMatchingPatterns();
			for (const k of Array.from(mappedPatterns.keys())) {
				const pattern = mappedPatterns.get(k);
				if (pattern instanceof UnresolvedPattern) {
					const resolvedPattern =
						await PatternResolver.promptAndResolve(pattern);
					if (resolvedPattern) mappedPatterns.set(k, resolvedPattern);
				}
			}
			const meaningfulTransactions =
				this.buildMeaningfulTransactions(mappedPatterns);

			const outTxt = this.buildTsvFile(meaningfulTransactions);

			// eslint-disable-next-line @typescript-eslint/no-empty-function
			fs.writeFile('out.tsv', outTxt, () => {});

			this.patterns.savePatterns();
		});
	}

	removeTransactionsBefore(dateBefore: string): void {
		this.transactions = this.transactions.filter((transaction) => {
			const transactionDate = moment(transaction.date, [
				'M/D/YYYY',
				'MM/D/YYYY',
				'M/DD/YYYY',
				'MM/DD/YYYY',
			]);
			return transactionDate.isAfter(
				moment(dateBefore, 'DD/MM/YYYY').subtract(1, 'day')
			);
		});
	}

	async mapTransactionsToMatchingPatterns(): Promise<
		Map<number, ResolvedPattern | UnresolvedPattern>
	> {
		const mappedPatterns: Map<number, ResolvedPattern | UnresolvedPattern> =
			new Map();

		for (let i = 0; i < this.transactions.length; i++) {
			mappedPatterns.set(
				i,
				Mapper.RawTransactionToMatchingPattern(this.transactions[i])
			);
		}

		return mappedPatterns;
	}

	buildMeaningfulTransactions(
		matchingPatterns: Map<number, Pattern>
	): MeaningfulTransaction[] {
		const meaningfulTransactions: MeaningfulTransaction[] = [];

		for (let i = 0; i < this.transactions.length; i++) {
			const foundPattern = matchingPatterns.get(i);
			if (foundPattern)
				meaningfulTransactions.push(
					this.buildMeaningfulTransaction(
						foundPattern,
						this.transactions[i]
					)
				);
		}
		return meaningfulTransactions;
	}

	buildMeaningfulTransaction(
		foundPattern: Pattern,
		transaction: RawTransaction
	): MeaningfulTransaction {
		const meaningfulTransaction =
			Mapper.MeaningfulTransactionFromRawTransaction(
				transaction,
				this.account,
				foundPattern
			);
		return meaningfulTransaction;
	}

	buildTsvFile(meaningfulTransactions: MeaningfulTransaction[]): string {
		let outTxt =
			'Date\tAccount\tMain Cat.\tSub Cat.\tContents\tAmount\tInc./Exp.\tDetails\n';
		for (const meaningfulTransaction of meaningfulTransactions) {
			outTxt += Stringify.MeaningfulTransaction(
				'tsv',
				meaningfulTransaction
			);
			outTxt += '\n';
		}
		return outTxt;
	}
}

export default App;
