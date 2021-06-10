import prompt, { RevalidatorSchema } from 'prompt';
import {
	promptConformingText,
	promptMultipleChoice,
} from '../../src/Console/General';
import { InvalidNumberChoiceError } from '../../src/Utility/Errors';

describe('Console/General', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('promptMultipleChoice()', () => {
		let mockPromptGet: jest.SpyInstance;
		let mockOutput: number;
		let mockStdout: string;
		let promptSchema: (
			| string
			| number
			| prompt.Schema
			| prompt.RevalidatorSchema
		)[];

		beforeAll(() => {
			mockOutput = -1;
			mockPromptGet = jest
				.spyOn(prompt, 'get')
				.mockImplementation(async (schema) => {
					promptSchema = schema;
					return { choice: mockOutput };
				});
			// eslint-disable-next-line no-console
			console.log = jest.fn((text) => {
				mockStdout = text;
			});
		});

		beforeEach(() => {
			mockOutput = 1;
			mockStdout = '';
		});

		test('should call prompt.get()', async () => {
			await promptMultipleChoice('', 1);
			expect(prompt.get).toHaveBeenCalledTimes(1);
		});

		test('should return 1', async () => {
			expect(await promptMultipleChoice('', 5)).toBe(1);
		});

		test('should print the message to the console', async () => {
			const message = 'message';
			await promptMultipleChoice(message, 1);
			expect(mockStdout).toBe(message);
		});

		test('should pass a validator function to prompt.get()', async () => {
			await promptMultipleChoice('', 2);
			const conformFn = (
				(promptSchema[0] as prompt.Schema).properties
					?.choice as RevalidatorSchema
			).conform;
			expect(conformFn).toBeFunction();
		});

		test.each(['1', '2'])(
			'should validate the value and allow it',
			async (inp) => {
				await promptMultipleChoice('', 2);
				const conformFn = (
					(promptSchema[0] as prompt.Schema).properties
						?.choice as RevalidatorSchema
				).conform;

				expect(conformFn?.(inp)).toBeTrue();
			}
		);

		test.each(['0', '3', 'hello', '', '1.2345'])(
			'should validate the value and reject it',
			async (inp) => {
				await promptMultipleChoice('', 2);
				const conformFn = (
					(promptSchema[0] as prompt.Schema).properties
						?.choice as RevalidatorSchema
				).conform;

				expect(conformFn?.(inp)).toBeFalse();
			}
		);

		test('should throw on invalid value received from prompt.get()', async () => {
			let val = '5000';
			mockPromptGet.mockImplementation(() => ({ choice: val }));

			await expect(() => promptMultipleChoice('', 2)).rejects.toThrow(
				InvalidNumberChoiceError
			);

			val = 'halllooo';
			await expect(() => promptMultipleChoice('', 2)).rejects.toThrow(
				InvalidNumberChoiceError
			);

			val = '1.5';
			await expect(() => promptMultipleChoice('', 2)).rejects.toThrow(
				InvalidNumberChoiceError
			);
		});
	});

	describe('promptConformingText()', () => {
		let mockOutput: string;
		let mockStdout: string;
		let promptSchema: (
			| string
			| number
			| prompt.Schema
			| prompt.RevalidatorSchema
		)[];

		beforeAll(() => {
			mockOutput = 'out';
			jest.spyOn(prompt, 'get').mockImplementation(async (schema) => {
				promptSchema = schema;
				return { text: mockOutput };
			});
			// eslint-disable-next-line no-console
			console.log = jest.fn((text) => {
				mockStdout = text;
			});
		});

		beforeEach(() => {
			mockOutput = 'out';
			mockStdout = '';
		});

		test('should call prompt.get()', async () => {
			await promptConformingText('msg', () => true, 'wrong');
			expect(prompt.get).toHaveBeenCalledTimes(1);
		});

		test('should return `out`', async () => {
			expect(await promptConformingText('msg', () => true, 'wrong')).toBe(
				'out'
			);
		});

		test.each(['text', '', '˚∆å¥∑ç˜åœ∆ß˚å˜≈˜'])(
			'should return proper output',
			async (s) => {
				mockOutput = s;
				expect(
					await promptConformingText(mockOutput, () => true, 'wrong')
				).toBe(mockOutput);
			}
		);

		test('should print the message to the console', async () => {
			const message = 'message';
			await promptConformingText(message, () => true, 'wrong');
			expect(mockStdout).toBe(message);
		});

		test('should pass the validator function forward to prompt.get()', async () => {
			const conformExp = () => true;
			await promptConformingText('msg', conformExp, 'wrong');
			const conformAct = (
				(promptSchema[0] as prompt.Schema).properties
					?.text as RevalidatorSchema
			).conform;

			expect(conformAct).toBeFunction();
			expect(conformAct).toBe(conformExp);
		});
	});
});
