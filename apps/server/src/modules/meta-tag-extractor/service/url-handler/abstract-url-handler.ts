import { basename } from 'node:path';
import { MetaData } from '../../types';

export abstract class AbstractUrlHandler {
	protected abstract patterns: RegExp[];

	protected extractId(url: string): string | undefined {
		const results: RegExpMatchArray = this.patterns
			.map((pattern: RegExp) => pattern.exec(url))
			.filter((result) => result !== null)
			.find((result) => (result?.length ?? 0) >= 2) as RegExpMatchArray;

		if (results[1]) {
			return results[1];
		}
		return undefined;
	}

	doesUrlMatch(url: string): boolean {
		const doesMatch = this.patterns.some((pattern) => pattern.test(url));
		return doesMatch;
	}

	getDefaultMetaData(url: string, partial: Partial<MetaData> = {}): MetaData {
		const urlObject = new URL(url);
		const title = basename(urlObject.pathname);
		return {
			title,
			description: '',
			url,
			type: 'unknown',
			...partial,
		};
	}
}
