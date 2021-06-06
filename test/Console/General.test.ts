import prompt, { RevalidatorSchema } from 'prompt';
import { promptMultipleChoice } from '../../src/Console/General';

describe('Console/General', () => {
	describe('promptMultipleChoice()', () => {
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
			jest.spyOn(prompt, 'get').mockImplementation(async (schema) => {
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

		test('should pass a proper validator function to prompt.get()', async () => {
			await promptMultipleChoice('', 2);
			const conformFn = (
				(promptSchema[0] as prompt.Schema).properties
					?.choice as RevalidatorSchema
			).conform;

			expect(conformFn?.('1')).toBeTrue();
			expect(conformFn?.('2')).toBeTrue();
			expect(conformFn?.('0')).toBeFalse();
			expect(conformFn?.('3')).toBeFalse();
			expect(conformFn?.('hello')).toBeFalse();
			expect(conformFn?.('')).toBeFalse();
			expect(conformFn?.('1.2345')).toBeFalse();
		});
	});
});
