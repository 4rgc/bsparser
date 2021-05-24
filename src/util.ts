import fs from 'fs';

export type Pattern = {
	key: string[];
	'Main Cat.': string;
	'Sub Cat.'?: string;
	Contents: string;
	'Inc./Exp.': string;
	Details?: string;
};

export const readFileAsText = (path: string): string => {
	return fs.readFileSync(path, 'utf-8');
};
