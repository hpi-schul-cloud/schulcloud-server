import AdmZip from 'adm-zip';
import { JSDOM } from 'jsdom';
import { CommonCartridgeResourceTypeV1P1 } from './common-cartridge-import.enums';
import {
	CommonCartridgeOrganizationProps,
	CommonCartridgeResourceProps,
	CommonCartridgeWebLinkResourceProps,
} from './common-cartridge-import.types';

export class CommonCartridgeResourceFactory {
	constructor(private readonly archive: AdmZip) {}

	public create(organization: CommonCartridgeOrganizationProps): CommonCartridgeResourceProps | undefined {
		if (!this.isValidOrganization(organization)) {
			return undefined;
		}

		const content = this.archive.readAsText(organization.resourcePath);

		switch (organization.resourceType) {
			case CommonCartridgeResourceTypeV1P1.WEB_LINK:
				return this.createWebLinkResource(content);
			default:
				return undefined;
		}
	}

	private isValidOrganization(organization: CommonCartridgeOrganizationProps): boolean {
		const { isResource, isInlined, resourcePath } = organization;
		const isValidOrganization = isResource && !isInlined && resourcePath !== '';

		return isValidOrganization;
	}

	private createWebLinkResource(content: string): CommonCartridgeWebLinkResourceProps | undefined {
		if (!this.isValidXml(content)) {
			return undefined;
		}

		const resource = new JSDOM(content, { contentType: 'text/xml' }).window.document;
		const title = resource.querySelector('webLink > title')?.textContent || '';
		const url = resource.querySelector('webLink > url')?.getAttribute('href') || '';

		return {
			type: CommonCartridgeResourceTypeV1P1.WEB_LINK,
			title,
			url,
		};
	}

	private isValidXml(content: string): boolean {
		try {
			const validateXml = () => new JSDOM(content, { contentType: 'text/xml' });

			validateXml();

			return true;
		} catch (error) {
			return false;
		}
	}
}
