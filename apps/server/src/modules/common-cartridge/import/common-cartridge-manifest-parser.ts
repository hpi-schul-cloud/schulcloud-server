import { JSDOM } from 'jsdom';
import { CommonCartridgeFileParserOptions, CommonCartridgeOrganizationProps } from './common-cartridge-import.types';
import { CommonCartridgeOrganizationVisitor } from './utils/common-cartridge-organization-visitor';

export class CommonCartridgeManifestParser {
	private readonly doc: Document;

	constructor(manifest: string, private readonly options: CommonCartridgeFileParserOptions) {
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

	public getOrganizations(): CommonCartridgeOrganizationProps[] {
		const visitor = new CommonCartridgeOrganizationVisitor(this.doc, this.options);
		const result = visitor.findAllOrganizations();

		return result;
	}
}
