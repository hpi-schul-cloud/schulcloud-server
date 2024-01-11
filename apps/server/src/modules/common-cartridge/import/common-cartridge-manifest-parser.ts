import { JSDOM } from 'jsdom';

export class CommonCartridgeManifestParser {
	private readonly doc: Document;

	public constructor(manifest: string) {
		this.doc = new JSDOM(manifest).window.document;
	}

	public getSchema(): string | undefined {
		const schema = this.doc.querySelector('manifest > metadata > schema');

		return schema?.textContent || undefined;
	}

	public getVersion(): string | undefined {
		const version = this.doc.querySelector('manifest > metadata > schemaversion');

		return version?.textContent || undefined;
	}

	public getTitle(): string | undefined {
		const title = this.doc.querySelector('manifest > metadata > lom > general > title > string');

		return title?.textContent || undefined;
	}
}
