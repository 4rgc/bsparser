import { MeaningfulTransaction, RawTransaction } from './Transactions';
import { Pattern } from './util';

export default class Mapper {
	static MeaningfulTransactionFromRawTransaction(
		rawTransaction: RawTransaction,
		account: string,
		pattern: Pattern
	): MeaningfulTransaction {
		const meaningfulTransaction = new MeaningfulTransaction(account);

		meaningfulTransaction['Date'] = rawTransaction.date;
		meaningfulTransaction['Main Cat.'] = pattern['Main Cat.'];
		meaningfulTransaction['Sub Cat.'] = pattern['Sub Cat.'];
		meaningfulTransaction['Contents'] = pattern['Contents'];
		meaningfulTransaction['Amount'] = Math.abs(rawTransaction.amount);
		meaningfulTransaction['Inc./Exp.'] = pattern['Inc./Exp.'];
		meaningfulTransaction['Details'] = pattern['Details'];

		return meaningfulTransaction;
	}
}
