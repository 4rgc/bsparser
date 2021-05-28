import { Pattern } from '../types';
import { promptMultipleChoice } from './General';

export const promptResolvePatternOrSkipTransaction = (): Promise<number> => {
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
