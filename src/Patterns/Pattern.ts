export default class Pattern {
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

	appendKey(newKey: string): void {
		if (!this.key.includes(newKey)) this.key.push(newKey);
	}
}
