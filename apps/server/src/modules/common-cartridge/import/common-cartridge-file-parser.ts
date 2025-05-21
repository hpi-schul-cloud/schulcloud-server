import AdmZip from 'adm-zip';
import { CheerioAPI, load } from 'cheerio';
import {
	CommonCartridgeOrganizationProps,
	CommonCartridgeResourceProps,
	DEFAULT_FILE_PARSER_OPTIONS,
} from './common-cartridge-import.types';
import { CommonCartridgeManifestParser } from './common-cartridge-manifest-parser';
import { CommonCartridgeResourceFactory } from './common-cartridge-resource-factory';
import { CommonCartridgeImportUtils } from './utils/common-cartridge-import-utils';
import { CommonCartridgeManifestNotFoundException } from './utils/common-cartridge-manifest-not-found.exception';
import { CommonCartridgeResourceNotFoundException } from './utils/common-cartridge-resource-not-found.exception';
import { CommonCartridgeOrganizationVisitorNode } from './utils/visitor';

export class CommonCartridgeFileParser {
	private readonly manifestParser: CommonCartridgeManifestParser;

	private readonly archive: AdmZip;

	private readonly resourceFactory: CommonCartridgeResourceFactory;

	constructor(file: Buffer, public readonly options = DEFAULT_FILE_PARSER_OPTIONS) {
		this.archive = new AdmZip(file);
		this.manifestParser = new CommonCartridgeManifestParser(this.getManifestFromArchive(), this.options);
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

	public getOrganizations(): CommonCartridgeOrganizationVisitorNode[] {
		const organizations = this.manifestParser.getOrganizations();

		return organizations;
	}

	public getResource(organization: CommonCartridgeOrganizationProps): CommonCartridgeResourceProps | undefined {
		this.checkOrganization(organization);

		const resource = this.resourceFactory.create(organization, this.options.inputFormat);

		return resource;
	}

	public getResourceAsString(organization: CommonCartridgeOrganizationProps): string {
		this.checkOrganization(organization);

		const resource = this.archive.readAsText(organization.resourcePath);

		return resource;
	}

	private getManifestFromArchive(): CheerioAPI {
		try {
			const manifestString = CommonCartridgeImportUtils.getManifestFileAsString(this.archive);
			if (!manifestString) {
				throw new CommonCartridgeManifestNotFoundException();
			}

			const manifest = load(manifestString, { xml: true });

			return manifest;
		} catch (error) {
			throw new CommonCartridgeManifestNotFoundException();
		}
	}

	private checkOrganization(organization: CommonCartridgeOrganizationProps): void {
		if (!organization.isResource || !this.archive.getEntry(organization.resourcePath)) {
			throw new CommonCartridgeResourceNotFoundException();
		}
	}
}
