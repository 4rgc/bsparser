import Pattern from '../src/Patterns/Pattern';
import { testPattern } from './testutils';

describe('Pattern', () => {
	let pattern: Pattern;
	const newKey = 'abcd1234';

	beforeEach(() => {
		pattern = new Pattern();
		Object.assign(pattern, testPattern);
	});
	describe('appendKey()', () => {
		test('should return void', () => {
			expect(jest.fn(() => pattern.appendKey(newKey))).not.toReturn();
		});

		test('should append the new key', () => {
			pattern.appendKey(newKey);
			expect(pattern.key).toContain(newKey);
		});

		test('should not add the new key if it already exists', () => {
			pattern.appendKey(newKey);
			expect(pattern.key.filter((k) => k === newKey)).toBeArrayOfSize(1);
		});
	});
});
