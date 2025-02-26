import { FileRecordParentType, StorageLocation } from '@infra/files-storage-client/generated';
import { ICurrentUser } from '@infra/auth-guard';
import AdmZip from 'adm-zip';
import { JSDOM } from 'jsdom';
import { CommonCartridgeResourceTypeV1P1 } from './common-cartridge-import.enums';
import {
	CommonCartridgeFileResourceProps,
	CommonCartridgeOrganizationProps,
	CommonCartridgeResourceProps,
	DEFAULT_FILE_PARSER_OPTIONS,
} from './common-cartridge-import.types';
import { CommonCartridgeManifestParser } from './common-cartridge-manifest-parser';
import { CommonCartridgeResourceFactory } from './common-cartridge-resource-factory';
import { CommonCartridgeImportUtils } from './utils/common-cartridge-import-utils';
import { CommonCartridgeManifestNotFoundException } from './utils/common-cartridge-manifest-not-found.exception';
import { CommonCartridgeResourceNotFoundException } from './utils/common-cartridge-resource-not-found.exception';

export class CommonCartridgeFileParser {
	private readonly manifestParser: CommonCartridgeManifestParser;

	private readonly archive: AdmZip;

	private readonly resourceFactory: CommonCartridgeResourceFactory;

	constructor(file: Buffer, private readonly options = DEFAULT_FILE_PARSER_OPTIONS) {
		this.archive = new AdmZip(file);
		this.manifestParser = new CommonCartridgeManifestParser(this.getManifestAsDocument(), this.options);
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

	public getOrganizations(): CommonCartridgeOrganizationProps[] {
		const organizations = this.manifestParser.getOrganizations();

		return organizations;
	}

	public getResource(organization: CommonCartridgeOrganizationProps): CommonCartridgeResourceProps | undefined {
		this.checkOrganization(organization);

		const resource = this.resourceFactory.create(organization, this.options.inputFormat);

		return resource;
	}

	public getFilesResource(
		organization: CommonCartridgeOrganizationProps,
		currentUser: ICurrentUser
	): CommonCartridgeFileResourceProps | undefined {
		this.checkOrganization(organization);

		const resource = this.resourceFactory.create(organization, this.options.inputFormat);

		if (
			resource &&
			organization.resourceType === CommonCartridgeResourceTypeV1P1.WEB_CONTENT &&
			organization.path.endsWith('.html')
		) {
			return undefined;
		}

		if (resource && organization.resourceType === CommonCartridgeResourceTypeV1P1.WEB_CONTENT) {
			const commonCartridgeFileResource: CommonCartridgeFileResourceProps = {
				type: CommonCartridgeResourceTypeV1P1.WEB_CONTENT,
				storageLocationId: currentUser.userId,
				storageLocation: StorageLocation.SCHOOL,
				parentId: organization.identifier,
				parentType: FileRecordParentType.BOARDNODES, // should be clarified could be also a task
				file: new File([(<CommonCartridgeFileResourceProps>resource).html as BlobPart], organization.title),
				html: (<CommonCartridgeFileResourceProps>resource).html,
			};
			return commonCartridgeFileResource;
		}

		return undefined;
	}

	public getResourceAsString(organization: CommonCartridgeOrganizationProps): string {
		this.checkOrganization(organization);

		const resource = this.archive.readAsText(organization.resourcePath);

		return resource;
	}

	private getManifestAsDocument(): Document {
		try {
			const manifestString = CommonCartridgeImportUtils.getManifestFileAsString(this.archive);
			const manifestDocument = new JSDOM(manifestString as string, { contentType: 'text/xml' }).window.document;

			return manifestDocument;
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
