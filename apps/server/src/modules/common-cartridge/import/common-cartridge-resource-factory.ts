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
		const { title } = organization;

		switch (organization.resourceType) {
			case CommonCartridgeResourceTypeV1P1.WEB_LINK:
				return this.createWebLinkResource(content, title);
			case CommonCartridgeResourceTypeV1P1.WEB_CONTENT:
				return this.createWebContentResource(content, title);
			default:
				return undefined;
		}
	}

	private isValidOrganization(organization: CommonCartridgeOrganizationProps): boolean {
		const { isResource, isInlined, resourcePath } = organization;
		const isValidOrganization = isResource && !isInlined && resourcePath !== '';

		return isValidOrganization;
	}

	private createWebLinkResource(content: string, title: string): CommonCartridgeWebLinkResourceProps | undefined {
		const document = this.tryCreateDocument(content, 'text/xml');

		if (!document) {
			return undefined;
		}

		const url = document.querySelector('webLink > url')?.getAttribute('href') ?? '';

		return {
			type: CommonCartridgeResourceTypeV1P1.WEB_LINK,
			title,
			url,
		};
	}

	private createWebContentResource(content: string, title: string): CommonCartridgeWebContentResourceProps | undefined {
		const document = this.tryCreateDocument(content, 'text/html');

		if (!document) {
			return undefined;
		}

		const html = document.body.textContent?.trim() ?? '';

		return {
			type: CommonCartridgeResourceTypeV1P1.WEB_CONTENT,
			title,
			html,
		};
	}

	private tryCreateDocument(content: string, contentType: 'text/html' | 'text/xml'): Document | undefined {
		try {
			const parser = new JSDOM(content, { contentType }).window.document;

			return parser;
		} catch (error) {
			return undefined;
		}
	}
}
