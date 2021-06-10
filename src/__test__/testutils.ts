import Pattern from '../Patterns/Pattern';
import { RawTransaction, MeaningfulTransaction } from '../Utility/Transactions';

const testPattern = Object.assign(new Pattern(), {
	key: ['A', 'B'],
	'Main Cat.': 'Cat',
	'Sub Cat.': 'Subcat',
	Contents: 'AB',
	'Inc./Exp.': 'Exp',
	Details: '',
});

const testRawTransaction: RawTransaction = {
	date: '01/01/1970',
	desc: 'test #51234 OK LMAO XDDDDDD',
	amount: 10,
};

const testMeaningfulTransaction = new MeaningfulTransaction('credit');
testMeaningfulTransaction.Amount = 10;
testMeaningfulTransaction.Contents = 'description';
testMeaningfulTransaction.Date = '01/01/1970';
testMeaningfulTransaction.Details = '';
testMeaningfulTransaction['Inc./Exp.'] = 'exp';
testMeaningfulTransaction['Main Cat.'] = 'cat';
testMeaningfulTransaction['Sub Cat.'] = 'subcat';

const MeaningfulTransactionOrder: (string & keyof MeaningfulTransaction)[] = [
	'Date',
	'Account',
	'Main Cat.',
	'Sub Cat.',
	'Contents',
	'Amount',
	'Inc./Exp.',
	'Details',
];

const testPatterns = [
	Object.assign(new Pattern(), {
		key: ['test', 'TST'],
		Contents: 'Test',
		'Main Cat.': 'testcat',
		'Sub Cat.': 'subcat',
		'Inc./Exp.': '支出',
	}),
	Object.assign(new Pattern(), {
		key: ['t1', 'T1'],
		Contents: 'Test1',
		'Main Cat.': 'testcat',
		'Inc./Exp.': '支出',
	}),
	Object.assign(new Pattern(), {
		key: ['tset', 'TSET'],
		Contents: 'Test3',
		'Main Cat.': 'testcat1',
		'Sub Cat.': 'subcat',
		'Inc./Exp.': '支出',
	}),
];

export {
	testPattern,
	testRawTransaction,
	testMeaningfulTransaction,
	MeaningfulTransactionOrder,
	testPatterns,
};
