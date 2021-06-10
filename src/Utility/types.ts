export interface Pattern {
	key: string[];
	'Main Cat.': string;
	'Sub Cat.'?: string;
	Contents: string;
	'Inc./Exp.': string;
	Details?: string;
}

export type Category = {
	category: string;
	subcategories: string[];
};
