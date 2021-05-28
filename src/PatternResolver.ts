import { RawTransaction } from './Transactions';
import { promptNewPattern, promptPatternKey } from './IO/NewPattern';
import {
	promptAppendPatternChoice,
	promptCreateOrAppendToPattern,
} from './IO/PatternResolution';
import { Pattern } from './types';
import { IResolver, IResolved, IUnresolved } from './Resolver';
import patterns from './TransactionPatterns';
import { InvalidNumberChoiceError } from './Errors';

export class ResolvedPattern implements IResolved, Pattern {
	constructor(pattern: Pattern) {
		Object.assign(this, pattern);
	}

	resolved: true = true;
	key: string[] = [];
	'Main Cat.': string;
	'Sub Cat.'?: string;
	Contents = '';
	'Inc./Exp.': string;
	Details?: string;
}

export class UnresolvedPattern implements IUnresolved, Pattern {
	constructor(transaction: RawTransaction) {
		this.transaction = transaction;
	}

	resolved: false = false;
	transaction: RawTransaction;
	key: string[] = [];
	'Main Cat.': string;
	'Sub Cat.'?: string;
	Contents = '';
	'Inc./Exp.': string;
	Details?: string;
}

class PatternResolver
	implements IResolver<Pattern, UnresolvedPattern, ResolvedPattern>
{
	async resolve(
		unresolvedObject: UnresolvedPattern
	): Promise<ResolvedPattern> {
		const key = await promptPatternKey(unresolvedObject.transaction);
		const choice = await promptCreateOrAppendToPattern();
		if (choice == 1) {
			return this.createNewPattern(key);
		} else if (choice == 2) {
			return this.appendToPattern(key);
		} else throw new InvalidNumberChoiceError(1, 2);
	}
	async resolveAll(
		unresolvedObjects: UnresolvedPattern[]
	): Promise<ResolvedPattern[]> {
		const resolvedPatterns: ResolvedPattern[] = [];

		for (const obj of unresolvedObjects) {
			resolvedPatterns.push(await this.resolve(obj));
		}

		return resolvedPatterns;
	}

	private async createNewPattern(
		key: Pattern['key'][0]
	): Promise<ResolvedPattern> {
		const categories = patterns.getAllCategories();

		const pattern: Pattern = await promptNewPattern(key, categories);
		patterns.addPattern(pattern);
		return new ResolvedPattern(pattern);
	}

	private async appendToPattern(
		key: Pattern['key'][0]
	): Promise<ResolvedPattern> {
		const descriptions = patterns.getAllContents();

		const description = await promptAppendPatternChoice(descriptions);
		patterns.appendKeyToPattern(key, description);
		const appendedPattern = patterns.findByDescription(description);
		if (!appendedPattern) throw new Error('appendedPattern was null');
		return new ResolvedPattern(appendedPattern);
	}
}

export default new PatternResolver();
