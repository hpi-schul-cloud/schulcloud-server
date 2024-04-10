import AdmZip from 'adm-zip';
import { JSDOM } from 'jsdom';
import { CommonCartridgeResourceTypeV1P1, CommonCartridgeResourceTypeV1P3 } from './common-cartridge-import.enums';
import { OrganizationProps, ResourceProps, WebLinkResourceProps } from './common-cartridge-import.types';

export class CommonCartridgeResourceFactory {
	constructor(private readonly archive: AdmZip) {}

	public create(organization: OrganizationProps): ResourceProps | undefined {
		if (!this.isValidOrganization(organization)) {
			return undefined;
		}

		const content = this.archive.readAsText(organization.resourcePath);

		switch (organization.resourceType) {
			case CommonCartridgeResourceTypeV1P1.WEB_LINK:
			case CommonCartridgeResourceTypeV1P3.WEB_LINK:
				return this.createWebLinkResource(content);
			default:
				return undefined;
		}
	}

	private isValidOrganization(organization: OrganizationProps): boolean {
		const { isResource, isInlined, resourcePath } = organization;
		const isValidOrganization = isResource && !isInlined && resourcePath !== '';

		return isValidOrganization;
	}

	private createWebLinkResource(content: string): WebLinkResourceProps {
		// TODO: Can throw an error if the content is not a valid XML
		const resource = new JSDOM(content, { contentType: 'text/xml' }).window.document;
		const title = resource.querySelector('webLink > title')?.textContent || '';
		const url = resource.querySelector('webLink > url')?.getAttribute('href') || '';

		return {
			type: CommonCartridgeResourceTypeV1P1.WEB_LINK,
			title,
			url,
		};
	}
}
