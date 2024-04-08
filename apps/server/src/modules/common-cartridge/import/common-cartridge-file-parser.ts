import AdmZip from 'adm-zip';
import {
	DEFAULT_FILE_PARSER_OPTIONS,
	OrganizationProps,
	ResourceProps,
	ResourceType,
} from './common-cartridge-import.types';
import { CommonCartridgeManifestParser } from './common-cartridge-manifest-parser';
import { CommonCartridgeManifestNotFoundException } from './utils/common-cartridge-manifest-not-found.exception';
import { CommonCartridgeResourceNotFoundException } from './utils/common-cartridge-resource-not-found.exception';

export class CommonCartridgeFileParser {
	private readonly manifestParser: CommonCartridgeManifestParser;

	private readonly archive: AdmZip;

	public constructor(file: Buffer, private readonly options = DEFAULT_FILE_PARSER_OPTIONS) {
		this.archive = new AdmZip(file);
		this.manifestParser = new CommonCartridgeManifestParser(this.getManifestFileAsString(), this.options);
	}

	public get manifest(): CommonCartridgeManifestParser {
		return this.manifestParser;
	}

	public getResource(organization: OrganizationProps): ResourceProps | null {
		this.checkOrganization(organization);

		const resourceString = this.archive.readAsText(organization.resourcePath);
		const resourceXml = new DOMParser().parseFromString(resourceString, 'text/xml');

		if (organization.resourceType.startsWith('imswl_')) {
			const title = resourceXml.querySelector('webLink > title')?.textContent || '';
			const url = resourceXml.querySelector('webLink > url')?.getAttribute('href') || '';

			return {
				type: ResourceType.WEB_LINK,
				title,
				url,
			};
		}

		return null;
	}

	public getResourceAsString(organization: OrganizationProps): string {
		this.checkOrganization(organization);

		const resource = this.archive.readAsText(organization.resourcePath);

		return resource;
	}

	private getManifestFileAsString(): string | never {
		// imsmanifest.xml is the standard name, but manifest.xml is also valid until v1.3
		const manifest = this.archive.getEntry('imsmanifest.xml') || this.archive.getEntry('manifest.xml');

		if (manifest) {
			return this.archive.readAsText(manifest);
		}

		throw new CommonCartridgeManifestNotFoundException();
	}

	private checkOrganization(organization: OrganizationProps): void {
		if (!organization.isResource && !this.archive.getEntry(organization.resourcePath)) {
			throw new CommonCartridgeResourceNotFoundException();
		}
	}
}
