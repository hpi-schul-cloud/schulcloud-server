import { CommonCartridgeFileParserOptions, CommonCartridgeOrganizationProps } from './common-cartridge-import.types';
import { CommonCartridgeOrganizationVisitor } from './utils/common-cartridge-organization-visitor';

export class CommonCartridgeManifestParser {
	constructor(private readonly manifest: Document, private readonly options: CommonCartridgeFileParserOptions) {}

	public getSchema(): string | undefined {
		const result = this.manifest.querySelector('manifest > metadata > schema');

		return result?.textContent ?? undefined;
	}

	public getVersion(): string | undefined {
		const result = this.manifest.querySelector('manifest > metadata > schemaversion');

		return result?.textContent ?? undefined;
	}

	public getTitle(): string | undefined {
		const result = this.manifest.querySelector('manifest > metadata > lom > general > title > string');

		return result?.textContent ?? undefined;
	}

	public getOrganizations(): CommonCartridgeOrganizationProps[] {
		const visitor = new CommonCartridgeOrganizationVisitor(this.manifest, this.options);
		const result = visitor.findAllOrganizations();

		return result;
	}
}
