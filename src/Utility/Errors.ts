import { RawTransaction } from '../Transactions';
import { Pattern } from '../types';

export class MultipleMatchingPatternsFoundError extends Error {
	constructor(
		rawTransaction: RawTransaction,
		matchingPatterns: (Pattern | void)[]
	) {
		super();
		this.name = 'MultipleMatchingPatternsFoundError';
		this.message = `error: multiple matching patterns found\n\
                        transaction:\n\
                        ${JSON.stringify(rawTransaction)}\n\
                        patterns:\n\
                        ${JSON.stringify(matchingPatterns)}`;
	}
}

export class InvalidNumberChoiceError extends Error {
	constructor(from: number, to: number) {
		super();
		this.name = 'InvalidChoiceError';
		this.message = `invalid choice, expected ${from}-${to}`;
	}
}
