import { ICloneable } from '../Interfaces/ICloneable';

export default class Pattern implements ICloneable<Pattern> {
	key: string[];
	'Main Cat.': string;
	'Sub Cat.'?: string;
	Contents: string;
	'Inc./Exp.': string;
	Details?: string;

	constructor() {
		this.key = [];
		this.Contents = 'invalid';
	}
	clone(): Pattern {
		const clone = new Pattern();
		return Object.assign(clone, this);
	}

	appendKey(newKey: string): void {
		if (!this.key.includes(newKey)) this.key.push(newKey);
	}
}
