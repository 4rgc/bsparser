import App from '../ConsoleApp';
import { Stringify } from '../Utility/Stringify';
import { testMeaningfulTransaction, testPatterns } from './testutils';

describe('App', () => {
	let app: App;
	beforeAll(() => {
		// jest.mock('../src/TransactionPatterns');
		// jest.mock('../src/Transactions');
		Stringify.MeaningfulTransaction = jest.fn(() => '');
	});
	beforeEach(() => {
		app = new App();
		app.patterns.patterns = testPatterns;
	});
	afterEach(() => {
		jest.clearAllMocks();
	});
	describe('buildTsvFile()', () => {
		beforeEach(() => {
			app.patterns.loadPatterns = jest.fn();
		});
		test('should return a string', () => {
			expect(app.buildTsvFile([])).toBeString();
		});
		test('should return a header for the tsv file', () => {
			expect(app.buildTsvFile([])).toBe(
				'Date\tAccount\tMain Cat.\tSub Cat.\tContents\tAmount\tInc./Exp.\tDetails\n'
			);
		});
		test('should call toTsvString on the MeaningfulTransaction', () => {
			app.buildTsvFile([testMeaningfulTransaction]);
			expect(Stringify.MeaningfulTransaction).toBeCalledTimes(1);
		});
	});
});
