import { MeaningfulTransaction, RawTransaction } from './Transactions';
import { Pattern } from './types';
import patterns from './Patterns/TransactionPatterns';
import { ResolvedPattern, UnresolvedPattern } from './Patterns/PatternResolver';
import { MultipleMatchingPatternsFoundError } from './Utility/Errors';

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

	static RawTransactionToMatchingPattern(
		transaction: RawTransaction
	): ResolvedPattern | UnresolvedPattern {
		const matchingPatterns = patterns.findMatchingPatterns(transaction);

		if (matchingPatterns.length == 0) {
			return new UnresolvedPattern(transaction);
		} else if (matchingPatterns.length > 1) {
			throw new MultipleMatchingPatternsFoundError(
				transaction,
				matchingPatterns
			);
		} else {
			return new ResolvedPattern(matchingPatterns[0]);
		}
	}
}
