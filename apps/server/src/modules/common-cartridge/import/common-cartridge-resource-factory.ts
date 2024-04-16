import AdmZip from 'adm-zip';
import { JSDOM } from 'jsdom';
import { CommonCartridgeResourceTypeV1P1 } from './common-cartridge-import.enums';
import {
	CommonCartridgeOrganizationProps,
	CommonCartridgeResourceProps,
	CommonCartridgeWebContentResourceProps,
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
			case CommonCartridgeResourceTypeV1P1.WEB_CONTENT:
				return this.createWebContentResource(content);
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
		const document = this.tryCreateDocument(content);

		if (!document) {
			return undefined;
		}

		const title = document.querySelector('webLink > title')?.textContent || '';
		const url = document.querySelector('webLink > url')?.getAttribute('href') || '';

		return {
			type: CommonCartridgeResourceTypeV1P1.WEB_LINK,
			title,
			url,
		};
	}

	private createWebContentResource(content: string): CommonCartridgeWebContentResourceProps | undefined {
		const document = this.tryCreateDocument(content);

		if (!document) {
			return undefined;
		}

		const title = document.querySelector('webContent > title')?.textContent || '';
		const html = document.querySelector('webContent > html')?.textContent || '';

		return {
			type: CommonCartridgeResourceTypeV1P1.WEB_CONTENT,
			title,
			html,
		};
	}

	private tryCreateDocument(content: string): Document | undefined {
		try {
			const parser = new JSDOM(content, { contentType: 'text/xml' }).window.document;

			return parser;
		} catch (error) {
			return undefined;
		}
	}
}
