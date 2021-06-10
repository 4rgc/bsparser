import prompt from 'prompt';

export interface SettingsProps extends prompt.Properties {
	path: string;
	creditDebit: string;
	dateBefore: string;
}

export const promptSettings = (): Promise<SettingsProps> => {
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
