import AdmZip from 'adm-zip';
import { DEFAULT_FILE_PARSER_OPTIONS, OrganizationProps, ResourceProps } from './common-cartridge-import.types';
import { CommonCartridgeManifestParser } from './common-cartridge-manifest-parser';
import { CommonCartridgeResourceFactory } from './common-cartridge-resource-factory';
import { CommonCartridgeImportUtils } from './utils/common-cartridge-import-utils';
import { CommonCartridgeManifestNotFoundException } from './utils/common-cartridge-manifest-not-found.exception';
import { CommonCartridgeResourceNotFoundException } from './utils/common-cartridge-resource-not-found.exception';

export class CommonCartridgeFileParser {
	private readonly manifestParser: CommonCartridgeManifestParser;

	private readonly archive: AdmZip;

	private readonly resourceFactory: CommonCartridgeResourceFactory;

	public constructor(file: Buffer, private readonly options = DEFAULT_FILE_PARSER_OPTIONS) {
		this.archive = new AdmZip(file);
		this.manifestParser = new CommonCartridgeManifestParser(this.getManifestFileAsString(), this.options);
		this.resourceFactory = new CommonCartridgeResourceFactory(this.archive);
	}

	public getSchema(): string | undefined {
		const schema = this.manifestParser.getSchema();

		return schema;
	}

	public getVersion(): string | undefined {
		const version = this.manifestParser.getVersion();

		return version;
	}

	public getTitle(): string | undefined {
		const title = this.manifestParser.getTitle();

		return title;
	}

	public getOrganizations(): OrganizationProps[] {
		const organizations = this.manifestParser.getOrganizations();

		return organizations;
	}

	public getResource(organization: OrganizationProps): ResourceProps | undefined {
		this.checkOrganization(organization);

		const resource = this.resourceFactory.create(organization);

		return resource;
	}

	public getResourceAsString(organization: OrganizationProps): string {
		this.checkOrganization(organization);

		const resource = this.archive.readAsText(organization.resourcePath);

		return resource;
	}

	private getManifestFileAsString(): string {
		const manifest = CommonCartridgeImportUtils.getManifestFileAsString(this.archive);

		if (manifest) {
			return manifest;
		}

		throw new CommonCartridgeManifestNotFoundException();
	}

	private checkOrganization(organization: OrganizationProps): void {
		if (!organization.isResource && !this.archive.getEntry(organization.resourcePath)) {
			throw new CommonCartridgeResourceNotFoundException();
		}
	}
}
