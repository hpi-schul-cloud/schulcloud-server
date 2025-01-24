import { basename } from 'node:path';
import { MetaData, MetaDataEntityType } from '../../types';

export abstract class AbstractUrlHandler {
	protected abstract patterns: RegExp[];

	protected extractId(url: URL): string | undefined {
		const results: RegExpExecArray | undefined = this.patterns
			.map((pattern: RegExp) => pattern.exec(url.pathname))
			.filter((result: RegExpExecArray | null): result is RegExpExecArray => result !== null)
			.find((result: RegExpExecArray) => result.length >= 2);

		if (results && results[1]) {
			return results[1];
		}

		return undefined;
	}

	public doesUrlMatch(url: URL): boolean {
		const doesMatch = this.patterns.some((pattern) => pattern.test(url.pathname));

		return doesMatch;
	}

	public getDefaultMetaData(url: URL, partial: Partial<MetaData> = {}): MetaData {
		const urlObject = new URL(url);
		const title = basename(urlObject.pathname);

		return {
			title,
			description: '',
			url: url.toString(),
			type: MetaDataEntityType.UNKNOWN,
			...partial,
		};
	}
}
