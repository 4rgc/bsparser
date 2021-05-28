import fs from 'fs';

export const readFileAsText = (path: string): string => {
	return fs.readFileSync(path, 'utf-8');
};
