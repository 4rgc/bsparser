import fs from 'fs';
import {
	MeaningfulTransaction,
	RawTransaction,
	parseTransactionCSV,
} from './Transactions';
import { TransactionPatterns } from './TransactionPatterns';
import { Pattern, readFileAsText } from './util';
import moment from 'moment';
import {
	promptAppendPatternChoice,
	promptCategoryChoice,
	promptCreateOrAppendToPattern,
	promptDescription,
	promptIncomeOrExpense,
	promptPatternKey,
	promptProcessPatternOrSkipTransaction,
	promptSubcategoryChoice,
	promptUser,
} from './IO';

class App {
	patterns: TransactionPatterns;
	account: string;
	transactions: RawTransaction[];

	constructor() {
		this.patterns = new TransactionPatterns('patterns.json');
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

			const meaningfulTransactions =
				await this.buildMeaningfulTransactions();

			const outTxt = this.buildTsvFile(meaningfulTransactions);

			// eslint-disable-next-line @typescript-eslint/no-empty-function
			fs.writeFile('out.tsv', outTxt, () => {});

			this.patterns.savePatterns();
		});
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

	async buildMeaningfulTransactions(): Promise<MeaningfulTransaction[]> {
		const meaningfulTransactions: MeaningfulTransaction[] = [];

		for (let i = 0; i < this.transactions.length; i++) {
			const matchingPatterns = this.patterns.findMatchingPatterns(
				this.transactions[i]
			);

			if (matchingPatterns.length == 0) {
				await this.handleNoPatternFound(this.transactions[i]);
				i--;
				continue;
			}

			if (matchingPatterns.length > 1) {
				this.throwMultipleMatchingPatternsFound(
					this.transactions[i],
					matchingPatterns
				);
			}

			meaningfulTransactions.push(
				this.buildMeaningfulTransaction(
					matchingPatterns,
					this.transactions[i]
				)
			);
		}
		return meaningfulTransactions;
	}

	private async handleNoPatternFound(
		transaction: RawTransaction
	): Promise<Pattern | void> {
		const newPattern = await this.processPatternOrSkipTransaction(
			transaction
		);
		if (newPattern) {
			this.patterns.addPattern(newPattern);
			return newPattern;
		}
	}

	buildMeaningfulTransaction(
		matchingPatterns: Pattern[],
		transaction: RawTransaction
	): MeaningfulTransaction {
		if (matchingPatterns.length > 1) {
			console.error(
				`error: multiple matches found\ndesc: ${
					transaction.desc
				}\nkey entries: ${JSON.stringify(matchingPatterns)}`
			);
		}
		const foundPattern = matchingPatterns[0];
		const meaningfulTransaction = new MeaningfulTransaction(this.account);
		meaningfulTransaction.initFromRawTransaction(transaction, foundPattern);
		return meaningfulTransaction;
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

	async processPatternOrSkipTransaction(
		transaction: RawTransaction
	): Promise<void | Pattern> {
		const choice = await promptProcessPatternOrSkipTransaction();
		if (choice == 1) return this.processNewPattern(transaction);
		else if (choice == 2) return;
		else throw new Error('invalid choice (exp. 1/2)');
	}

	async processNewPattern(
		transaction: RawTransaction
	): Promise<void | Pattern> {
		const key = await promptPatternKey(transaction);
		return this.createOrAppendToPattern(key);
	}

	async createOrAppendToPattern(
		key: Pattern['key'][0]
	): Promise<Pattern | void> {
		const choice = await promptCreateOrAppendToPattern();
		if (choice == 1) {
			return this.createNewPattern(key);
		} else if (choice == 2) {
			return this.appendToPattern(key);
		} else {
			throw new Error('invalid choice (exp. 1/2)');
		}
	}

	async createNewPattern(key: Pattern['key'][0]): Promise<Pattern> {
		const descriptions = this.patterns.getAllContents();
		const categories = this.patterns.getAllCategories();

		const description = await promptDescription(descriptions);
		const category = await promptCategoryChoice(categories);
		const subcategory = await promptSubcategoryChoice(category, categories);
		const incomeExpense = await promptIncomeOrExpense();

		const pattern: Pattern = {
			key: [key],
			Contents: description,
			'Main Cat.': category.category,
			'Sub Cat.': subcategory,
			'Inc./Exp.': incomeExpense,
		};
		if (!subcategory) {
			delete pattern['Sub Cat.'];
		}
		return pattern;
	}

	async appendToPattern(key: Pattern['key'][0]): Promise<void> {
		const descriptions = this.patterns.getAllContents();

		const description = await promptAppendPatternChoice(descriptions);
		this.patterns.appendKeyToPattern(key, description);
	}

	private throwMultipleMatchingPatternsFound(
		transaction: RawTransaction,
		matchingPatterns: Pattern[]
	) {
		throw new Error(
			`error: multiple matching patterns found\n\
                    transaction:\n\
                    ${JSON.stringify(transaction)}\n\
                    patterns:\n\
                    ${JSON.stringify(matchingPatterns)}`
		);
	}
}

export default App;
