import { JSDOM } from 'jsdom';

export class CommonCartridgeManifestParser {
	private readonly doc: Document;

	public constructor(manifest: string) {
		this.doc = new JSDOM(manifest, { contentType: 'text/xml' }).window.document;
	}

	public getSchema(): string | undefined {
		const result = this.doc.querySelector('manifest > metadata > schema');

		return result?.textContent ?? undefined;
	}

	public getVersion(): string | undefined {
		const result = this.doc.querySelector('manifest > metadata > schemaversion');

		return result?.textContent ?? undefined;
	}

	public getTitle(): string | undefined {
		const result = this.doc.querySelector('manifest > metadata > lom > general > title > string');

		return result?.textContent ?? undefined;
	}
}
