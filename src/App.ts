import fs from 'fs';
import {
	MeaningfulTransaction,
	RawTransaction,
	parseTransactionCSV,
} from './Transactions';
import TransactionPatterns from './TransactionPatterns';
import { readFileAsText } from './util';
import moment from 'moment';
import { promptUser } from './IO';
import Mapper from './Mapper';
import { MultipleMatchingPatternsFoundError } from './Errors';
import { Pattern } from './types';
import PatternResolver, { UnresolvedPattern } from './PatternResolver';

class App {
	patterns: typeof TransactionPatterns;
	account: string;
	transactions: RawTransaction[];

	constructor() {
		this.patterns = TransactionPatterns;
		this.patterns.loadPatterns();
		this.account = '';
		this.transactions = new Array<RawTransaction>();
	}

	async run(): Promise<void> {
		const promptReceivedPromise = promptUser();

		promptReceivedPromise.then(async (result) => {
			this.account =
				Number.parseInt(result.creditDebit) == 1
					? 'クレジットカード'
					: 'デビットカード';

			const CSVData = readFileAsText(result.path);
			this.transactions = parseTransactionCSV(CSVData);
			this.removeTransactionsBefore(result.dateBefore);

			const mappedPatterns =
				await this.mapTransactionsToMatchingPatterns();
			for (const k of Array.from(mappedPatterns.keys())) {
				const pattern = mappedPatterns.get(k);
				if (pattern instanceof UnresolvedPattern) {
					mappedPatterns.set(
						k,
						await PatternResolver.resolve(pattern)
					);
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

	async mapTransactionsToMatchingPatterns(): Promise<Map<number, Pattern>> {
		const mappedPatterns: Map<number, Pattern> = new Map();

		for (let i = 0; i < this.transactions.length; i++) {
			const matchingPatterns = this.patterns.findMatchingPatterns(
				this.transactions[i]
			);

			if (matchingPatterns.length == 0) {
				const newUnresolved = new UnresolvedPattern(
					this.transactions[i]
				);
				mappedPatterns.set(i, newUnresolved);
			} else if (matchingPatterns.length > 1) {
				throw new MultipleMatchingPatternsFoundError(
					this.transactions[i],
					matchingPatterns
				);
			} else {
				mappedPatterns.set(i, matchingPatterns[0]);
			}
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
			outTxt += meaningfulTransaction.toTsvString();
			outTxt += '\n';
		}
		return outTxt;
	}
}

export default App;
