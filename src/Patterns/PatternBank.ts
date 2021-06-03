import fs from 'fs';
import { RawTransaction } from '../Transactions';
import { Category, Pattern } from '../types';
import { readFileAsText } from '../util';

class PatternBank {
	patterns: Pattern[];
	diskRelPath: string;
	constructor(path: string) {
		this.patterns = [];
		this.diskRelPath = path || 'patterns.json';
	}

	loadPatterns(): void {
		this.patterns = JSON.parse(readFileAsText(this.diskRelPath));
	}

	async savePatterns(): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		fs.writeFile(this.diskRelPath, JSON.stringify(this.patterns), () => {});
	}

	//TODO: add check for pattern existing
	addPattern(pattern: Pattern): void {
		this.patterns.push(pattern);
	}

	findMatchingPatterns(tra: RawTransaction): Pattern[] {
		return this.patterns.filter((pattern) => {
			for (const patternKey of pattern.key) {
				if (tra.desc.includes(patternKey)) return true;
			}
			return false;
		});
	}

	getAllKeys(): string[] {
		let s: Set<string> = new Set();
		for (const pattern of this.patterns) {
			s = new Set([...s, ...pattern.key]);
		}
		return [...s];
	}

	getAllContents(): string[] {
		return this.patterns.map((pattern) => pattern['Contents']);
	}

	getAllCategories(): Category[] {
		const categories: Category[] = [
			...new Set(this.patterns.map((pattern) => pattern['Main Cat.'])),
		].map((c) => {
			return { category: c, subcategories: [] };
		});
		for (const category of categories) {
			const subcategories = [
				...new Set(
					this.patterns.map((pattern) => {
						const subcategory = pattern['Sub Cat.']
							? pattern['Sub Cat.']
							: null;
						return pattern['Main Cat.'] === category.category
							? subcategory
							: null;
					})
				),
			];
			// remove null subcategories (from objects with no subcategory)
			category.subcategories = subcategories.filter(
				(v): v is string => typeof v === 'string'
			);
		}
		return categories;
	}

	appendKeyToPattern(key: Pattern['key'][0], desc: string): void {
		const foundPattern = this.patterns.find((p) => p['Contents'] == desc);
		if (foundPattern) foundPattern['key'].push(key);
		else throw new Error('Not found a pattern to push a key in');
	}

	findByDescription(description: string): Pattern | undefined {
		return this.patterns.find((p) => p['Contents'] === description);
	}
}

export default new PatternBank('patterns.json');
