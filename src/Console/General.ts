/* eslint-disable no-console */
import prompt from 'prompt';
import { InvalidNumberChoiceError } from '../Utility/Errors';

interface MultipleChoiceProps extends prompt.Properties {
	choice: string;
}

interface ConformingTextProps extends prompt.Properties {
	text: string;
}

export const promptMultipleChoice = async (
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
	const resNum = Number.parseFloat(res.choice);
	if (
		resNum < 1 ||
		resNum > choiceNumber ||
		isNaN(resNum) ||
		!Number.isInteger(resNum)
	)
		throw new InvalidNumberChoiceError(1, choiceNumber);
	return resNum;
};

export const promptConformingText = async (
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
