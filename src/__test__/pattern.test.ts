import Pattern from '../Patterns/Pattern';
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

	describe('clone()', () => {
		test('should return a Pattern object', () => {
			expect(pattern.clone()).toBeInstanceOf(Pattern);
		});

		test('should have same properties as the original object', () => {
			expect(pattern.clone()).toEqual(pattern);
		});

		test('should be a different object from the original', () => {
			expect(pattern.clone()).not.toBe(pattern);
		});
	});
});
