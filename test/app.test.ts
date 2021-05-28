import App from '../src/App';
import { MeaningfulTransaction } from '../src/Transactions';
import { testMeaningfulTransaction, testPatterns } from './testutils';

describe('App', () => {
	let app: App;
	beforeAll(() => {
		// jest.mock('../src/TransactionPatterns');
		// jest.mock('../src/Transactions');
		MeaningfulTransaction.prototype.toTsvString = jest.fn(() => '');
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
			expect(testMeaningfulTransaction.toTsvString).toBeCalledTimes(1);
		});
	});
});
