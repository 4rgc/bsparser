/* eslint-disable no-console */
import prompt from 'prompt';
import { RawTransaction } from './Transactions';
import { Category, Pattern } from './types';

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

const promptMultipleChoice = async (
	message: string,
	choiceNumber: number
): Promise<number> => {
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
};

const promptConformingText = async (
	msg: string,
	// Required by 'prompt'
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	conformCb: (value: any, data?: string) => boolean,
	wrongTextMsg: string
): Promise<string> => {
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
};

export const promptUser = (): Promise<SettingsProps> => {
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
};

export const promptProcessPatternOrSkipTransaction = (): Promise<number> => {
	const msg = `A new pattern was found. Would you like to add it or skip the transaction?\
                \n1 - Add \
                \n2 - Skip`;

	return promptMultipleChoice(msg, 2);
};

export const promptCreateOrAppendToPattern = (): Promise<number> => {
	const msg = `Would you like to create a new pattern or append it to an existing one? \
                    \n\t1 - Create \
                    \n\t2 - Append`;
	return promptMultipleChoice(msg, 2);
};

export const promptDescription = (
	descriptions: Pattern['Contents'][]
): Promise<string> => {
	const msg = 'Enter description for the new pattern: ';

	const wrongInputMsg =
		'This description is already in use. Please try again.';

	const conformCondition = (desc: string) => !descriptions.includes(desc);

	return promptConformingText(msg, conformCondition, wrongInputMsg);
};

export const promptCategoryChoice = async (
	categories: Category[]
): Promise<Category> => {
	const msg = 'Choose a category for the new pattern: \n';
	categories.push({ category: 'Make new', subcategories: [] });
	let categoriesStr = '';
	for (let i = 0; i < categories.length; i++) {
		categoriesStr += i + 1 + ' – ' + categories[i].category + '\t';
		if ((i + 1) % 5 == 0) categoriesStr += '\n';
	}

	const choice = await promptMultipleChoice(
		msg + categoriesStr,
		categories.length
	);
	if (choice == categories.length) {
		return promptNewCategory(categories);
	} else if (choice > categories.length) {
		throw new Error(`invalid choice (exp. 1-${categories.length + 1}`);
	}
	return categories[choice - 1];
};

const promptNewCategory = async (categories: Category[]): Promise<Category> => {
	const msg = 'Enter the name of the new category:';

	const conformCondition = (input: Category) => !categories.includes(input);

	const wrongInputMsg = 'This category already exists. Please try again.';

	const category = await promptConformingText(
		msg,
		conformCondition,
		wrongInputMsg
	);
	return { category, subcategories: [] };
};

export const promptSubcategoryChoice = async (
	category: Category,
	categories: Category[]
): Promise<string | undefined> => {
	const msg = 'Choose a subcategory for the new pattern: \n';
	const foundCategory = categories.find(
		(c) => JSON.stringify(c) === JSON.stringify(category)
	);
	const subcategories = foundCategory ? foundCategory.subcategories : [];
	subcategories.push('Make new');
	subcategories.push('None');
	let subcategoriesStr = '';
	for (let i = 0; i < subcategories.length; i++) {
		subcategoriesStr += i + 1 + ' – ' + subcategories[i] + '\t';
		if ((i + 1) % 5 == 0) subcategoriesStr += '\n';
	}

	const choice = await promptMultipleChoice(
		msg + subcategoriesStr,
		subcategories.length
	);
	if (choice == subcategories.length - 1) {
		return promptNewSubcategory(subcategories);
	} else if (choice == subcategories.length) {
		return undefined;
	} else if (choice > subcategories.length) {
		throw new Error(`invalid choice (exp. 1-${subcategories.length}`);
	}
	return subcategories[choice - 1];
};

export const promptNewSubcategory = (
	subcategories: Category['subcategories']
): Promise<string> => {
	const msg = 'Enter the name of the new subcategory:';

	const conformCondition = (input: string) => !subcategories.includes(input);

	const wrongInputMsg = 'This subcategory already exists. Please try again.';

	return promptConformingText(msg, conformCondition, wrongInputMsg);
};

export const promptIncomeOrExpense = async (): Promise<string> => {
	const msg = `Is the transaction with this pattern an income or an expense? \
                \n\t1 – Income \
                \n\t2 – Expense`;

	const choice = await promptMultipleChoice(msg, 2);
	if (choice == 1) return '収入';
	else if (choice == 2) return '支出';
	else throw new Error('invalid choice (exp. 1/2)');
};

export const promptAppendPatternChoice = async (
	descriptions: Pattern['Contents'][]
): Promise<string> => {
	const msg = 'Choose which pattern you want to append the key to:\n';
	let descriptionsStr = '';
	for (let i = 0; i < descriptions.length; i++) {
		descriptionsStr += i + 1 + ' – ' + descriptions[i] + '\t';
		if ((i + 1) % 5 == 0) descriptionsStr += '\n';
	}

	const choice = await promptMultipleChoice(
		msg + descriptionsStr,
		descriptions.length
	);
	if (choice > descriptions.length)
		throw new Error(`invalid choice (exp. 1-${descriptions.length}`);
	return descriptions[choice - 1];
};

export const promptPatternKey = (
	transaction: RawTransaction
): Promise<string> => {
	const msg = `Enter the key of the following transaction text: \
                    \n\t${transaction.desc}`;

	const conformCondition = (input: string) =>
		transaction.desc.includes(input);

	const wrongInputMsg = `This description is not a part of the transaction. Please try again. \
                    \n\t${transaction.desc}`;
	return promptConformingText(msg, conformCondition, wrongInputMsg);
};
