import { JSDOM } from 'jsdom';

export class CommonCartridgeManifestParser {
	private readonly doc: Document;

	public constructor(manifest: string) {
		this.doc = new JSDOM(manifest, { contentType: 'text/xml' }).window.document;
	}

	public getSchema(): string | null {
		const result = this.doc.querySelector('manifest > metadata > schema');

		return result?.textContent || null;
	}

	public getVersion(): string | null {
		const result = this.doc.querySelector('manifest > metadata > schemaversion');

		return result?.textContent || null;
	}

	public getTitle(): string | null {
		const result = this.doc.querySelector('manifest > metadata > lom > general > title > string');

		return result?.textContent || null;
	}
}
