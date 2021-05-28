import { RawTransaction } from '../Transactions';
import { Category, Pattern } from '../types';
import { promptConformingText, promptMultipleChoice } from './General';

const promptDescription = (): Promise<string> => {
	const msg = 'Enter description for the new pattern: ';

	const wrongInputMsg =
		'This description is already in use. Please try again.';

	const conformCondition = () =>
		true; /*(desc: string) => !descriptions.includes(desc);*/

	return promptConformingText(msg, conformCondition, wrongInputMsg);
};

const promptCategoryChoice = async (
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

const promptSubcategoryChoice = async (
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

const promptNewSubcategory = (
	subcategories: Category['subcategories']
): Promise<string> => {
	const msg = 'Enter the name of the new subcategory:';

	const conformCondition = (input: string) => !subcategories.includes(input);

	const wrongInputMsg = 'This subcategory already exists. Please try again.';

	return promptConformingText(msg, conformCondition, wrongInputMsg);
};

const promptIncomeOrExpense = async (): Promise<string> => {
	const msg = `Is the transaction with this pattern an income or an expense? \
                \n\t1 – Income \
                \n\t2 – Expense`;

	const choice = await promptMultipleChoice(msg, 2);
	if (choice == 1) return '収入';
	else if (choice == 2) return '支出';
	else throw new Error('invalid choice (exp. 1/2)');
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

export const promptNewPattern = async (
	key: string,
	categories: Category[]
): Promise<Pattern> => {
	const description = await promptDescription();
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
};
