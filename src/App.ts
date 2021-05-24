/* eslint-disable no-console */
import fs from 'fs';
import prompt from 'prompt';
import {
	MeaningfulTransaction,
	RawTransaction,
	parseTransactionCSV,
} from './Transactions';
import { Category, TransactionPatterns } from './TransactionPatterns';
import { Pattern, readFileAsText } from './util';
import moment from 'moment';

interface SettingsProps extends prompt.Properties {
	path: string;
	creditDebit: string;
	dateBefore: string;
}

interface MultipleChoiceProps extends prompt.Properties {
	choice: string;
}

interface ConformingTextProps extends prompt.Properties {
	text: string;
}

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
		const promptReceivedPromise = this.promptUser();

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

	promptUser(): Promise<SettingsProps> {
		prompt.start();

		const schema: prompt.RevalidatorSchema[] = [
			{
				name: 'path',
				description: 'Please specify the path to the statement',
				pattern: /^[/]?([^/ ]*[/])*([^/ ]+)$/,
				message: 'Must be a valid path to a file',
				required: true,
			},
			{
				name: 'creditDebit',
				description: '    ...credit (1) or debit (2) account',
				message: '1-credit, 2-debit',
				required: true,
			},
			{
				name: 'dateBefore',
				description:
					'    ...discard transactions before this date (dd/mm/yyyy)',
				pattern: /((0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/[12]\d{3})/,
				message: 'The date must be in the following format: dd/mm/yyyy',
				required: true,
			},
		];

		return prompt.get<SettingsProps>(schema);
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
				const newPattern = await this.processPatternOrSkipTransaction(
					this.transactions[i]
				);
				if (newPattern) {
					this.patterns.addPattern(newPattern);
				}
				i--;
				continue;
			}

			if (matchingPatterns.length > 1) {
				throw new Error(
					`error: multiple matching patterns found\n\
                    transation:\n\
                    ${JSON.stringify(this.transactions[i])}\n\
                    patterns:\n\
                    ${JSON.stringify(matchingPatterns)}`
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
		const choice = await this.promptProcessPatternOrSkipTransaction();
		if (choice == 1) return this.processNewPattern(transaction);
		else if (choice == 2) return;
		else throw new Error('invalid choice (exp. 1/2)');
	}

	promptProcessPatternOrSkipTransaction(): Promise<number> {
		const msg = `A new pattern was found. Would you like to add it or skip the transaction?\
                \n1 - Add \
                \n2 - Skip`;

		return this.promptMultipleChoice(msg, 2);
	}

	async processNewPattern(
		transaction: RawTransaction
	): Promise<void | Pattern> {
		const key = await this.promptPatternKey(transaction);
		return this.createOrAppendToPattern(key);
	}

	async createOrAppendToPattern(
		key: Pattern['key'][0]
	): Promise<Pattern | void> {
		const choice = await this.promptCreateOrAppendToPattern();
		if (choice == 1) {
			return this.createNewPattern(key);
		} else if (choice == 2) {
			return this.appendToPattern(key);
		} else {
			throw new Error('invalid choice (exp. 1/2)');
		}
	}

	promptCreateOrAppendToPattern(): Promise<number> {
		const msg = `Would you like to create a new pattern or append it to an existing one? \
                    \n\t1 - Create \
                    \n\t2 - Append`;
		return this.promptMultipleChoice(msg, 2);
	}

	async createNewPattern(key: Pattern['key'][0]): Promise<Pattern> {
		const description = await this.promptDescription();
		const category = await this.promptCategoryChoice();
		const subcategory = await this.promptSubcategoryChoice(category);
		const incomeExpense = await this.promptIncomeOrExpense();

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

	promptDescription(): Promise<string> {
		const msg = 'Enter description for the new pattern: ';
		const descriptions = this.patterns.getAllContents();

		const wrongInputMsg =
			'This description is already in use. Please try again.';

		const conformCondition = (desc: string) => !descriptions.includes(desc);

		return this.promptConformingText(msg, conformCondition, wrongInputMsg);
	}

	async promptCategoryChoice(): Promise<Category> {
		const msg = 'Choose a category for the new pattern: \n';
		const categories = this.patterns.getAllCategories();
		categories.push({ category: 'Make new', subcategories: [] });
		let categoriesStr = '';
		for (let i = 0; i < categories.length; i++) {
			categoriesStr += i + 1 + ' – ' + categories[i].category + '\t';
			if ((i + 1) % 5 == 0) categoriesStr += '\n';
		}

		const choice = await this.promptMultipleChoice(
			msg + categoriesStr,
			categories.length
		);
		if (choice == categories.length) {
			return this.promptNewCategory(categories);
		} else if (choice > categories.length) {
			throw new Error(`invalid choice (exp. 1-${categories.length + 1}`);
		}
		return categories[choice - 1];
	}

	async promptNewCategory(categories: Category[]): Promise<Category> {
		const msg = 'Enter the name of the new category:';

		const conformCondition = (input: Category) =>
			!categories.includes(input);

		const wrongInputMsg = 'This category already exists. Please try again.';

		const category = await this.promptConformingText(
			msg,
			conformCondition,
			wrongInputMsg
		);
		return { category, subcategories: [] };
	}

	async promptSubcategoryChoice(
		category: Category
	): Promise<string | undefined> {
		const msg = 'Choose a subcategory for the new pattern: \n';
		const foundCategory = this.patterns
			.getAllCategories()
			.find((c) => JSON.stringify(c) === JSON.stringify(category));
		const subcategories = foundCategory ? foundCategory.subcategories : [];
		subcategories.push('Make new');
		subcategories.push('None');
		let subcategoriesStr = '';
		for (let i = 0; i < subcategories.length; i++) {
			subcategoriesStr += i + 1 + ' – ' + subcategories[i] + '\t';
			if ((i + 1) % 5 == 0) subcategoriesStr += '\n';
		}

		const choice = await this.promptMultipleChoice(
			msg + subcategoriesStr,
			subcategories.length
		);
		if (choice == subcategories.length - 1) {
			return this.promptNewSubcategory(subcategories);
		} else if (choice == subcategories.length) {
			return undefined;
		} else if (choice > subcategories.length) {
			throw new Error(`invalid choice (exp. 1-${subcategories.length}`);
		}
		return subcategories[choice - 1];
	}

	promptNewSubcategory(subcategories: string[]): Promise<string> {
		const msg = 'Enter the name of the new subcategory:';

		const conformCondition = (input: string) =>
			!subcategories.includes(input);

		const wrongInputMsg =
			'This subcategory already exists. Please try again.';

		return this.promptConformingText(msg, conformCondition, wrongInputMsg);
	}

	async promptIncomeOrExpense(): Promise<string> {
		const msg = `Is the transaction with this pattern an income or an expense? \
                \n\t1 – Income \
                \n\t2 – Expense`;

		const choice = await this.promptMultipleChoice(msg, 2);
		if (choice == 1) return '収入';
		else if (choice == 2) return '支出';
		else throw new Error('invalid choice (exp. 1/2)');
	}

	async appendToPattern(key: Pattern['key'][0]): Promise<void> {
		const description = await this.promptAppendPatternChoice();
		this.patterns.appendKeyToPattern(key, description);
	}

	async promptAppendPatternChoice(): Promise<string> {
		const descriptions = this.patterns.getAllContents();

		const msg = 'Choose which pattern you want to append the key to:\n';
		let descriptionsStr = '';
		for (let i = 0; i < descriptions.length; i++) {
			descriptionsStr += i + 1 + ' – ' + descriptions[i] + '\t';
			if ((i + 1) % 5 == 0) descriptionsStr += '\n';
		}

		const choice = await this.promptMultipleChoice(
			msg + descriptionsStr,
			descriptions.length
		);
		if (choice > descriptions.length)
			throw new Error(`invalid choice (exp. 1-${descriptions.length}`);
		return descriptions[choice - 1];
	}

	promptPatternKey(transaction: RawTransaction): Promise<string> {
		const msg = `Enter the key of the following transaction text: \
                    \n\t${transaction.desc}`;

		const conformCondition = (input: string) =>
			transaction.desc.includes(input);

		const wrongInputMsg = `This description is not a part of the transaction. Please try again. \
                    \n\t${transaction.desc}`;
		return this.promptConformingText(msg, conformCondition, wrongInputMsg);
	}

	async promptMultipleChoice(
		message: string,
		choiceNumber: number
	): Promise<number> {
		prompt.start();
		console.log(message);

		const schema: prompt.Schema[] = [
			{
				properties: {
					choice: {
						conform: (input: string) =>
							Number.isInteger(
								Number(input == '' ? undefined : input)
							) &&
							Number(input) > 0 &&
							Number(input) <= choiceNumber,
						message: 'Please enter a valid choice',
						required: true,
					},
				},
			},
		];

		const res = await prompt.get<MultipleChoiceProps>(schema);
		return Number.parseInt(res.choice);
	}

	async promptConformingText(
		msg: string,
		// Required by 'prompt'
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		conformCb: (value: any, data?: string) => boolean,
		wrongTextMsg: string
	): Promise<string> {
		prompt.start();
		console.log(msg);

		const schema: prompt.Schema[] = [
			{
				properties: {
					text: {
						conform: conformCb,
						message: wrongTextMsg,
						required: true,
					},
				},
			},
		];

		const res = await prompt.get<ConformingTextProps>(schema);
		return res.text;
	}
}

export default App;
