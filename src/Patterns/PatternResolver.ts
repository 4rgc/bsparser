import { RawTransaction } from '../Transactions';
import { promptNewPattern, promptPatternKey } from '../Console/NewPattern';
import {
	promptAppendPatternChoice,
	promptCreateOrAppendToPattern,
} from '../Console/PatternResolution';
import Pattern from './Pattern';
import { IResolver, IResolved, IUnresolved } from '../Interfaces/IResolver';
import patterns from './PatternBank';
import { InvalidNumberChoiceError } from '../Utility/Errors';

export class ResolvedPattern extends Pattern implements IResolved {
	constructor(pattern: Pattern) {
		super();
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

export class UnresolvedPattern extends Pattern implements IUnresolved {
	constructor(transaction: RawTransaction) {
		super();
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
		const choice = await promptCreateOrAppendToPattern();
		if (choice == 1) {
			return this.createNewPattern(unresolvedObject.transaction);
		} else if (choice == 2) {
			return this.appendToPattern(unresolvedObject.transaction);
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
		transaction: RawTransaction
	): Promise<ResolvedPattern> {
		const key = await promptPatternKey(transaction);

		const categories = patterns.getAllCategories();
		const pattern: Pattern = await promptNewPattern(key, categories);
		patterns.addPattern(pattern);
		return new ResolvedPattern(pattern);
	}

	private async appendToPattern(
		transaction: RawTransaction
	): Promise<ResolvedPattern> {
		const key = await promptPatternKey(transaction);
		const descriptions = patterns.getAllContents();

		const description = await promptAppendPatternChoice(descriptions);
		const patternToAppend = patterns.findByDescription(description);
		if (!patternToAppend) throw new Error('patternToAppend was null');

		patternToAppend.appendKey(key);

		return new ResolvedPattern(patternToAppend);
	}
}

export default new PatternResolver();
