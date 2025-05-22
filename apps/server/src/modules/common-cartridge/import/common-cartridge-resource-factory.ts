import { sanitizeRichText } from '@shared/controller/transformer';
import { InputFormat } from '@shared/domain/types';
import AdmZip from 'adm-zip';
import { load } from 'cheerio';
import { CommonCartridgeResourceTypeV1P1 } from './common-cartridge-import.enums';
import {
	CommonCartridgeOrganizationProps,
	CommonCartridgeResourceProps,
	CommonCartridgeWebContentResourceProps,
	CommonCartridgeWebLinkResourceProps,
} from './common-cartridge-import.types';

export class CommonCartridgeResourceFactory {
	constructor(private readonly archive: AdmZip) {}

	public create(
		organization: CommonCartridgeOrganizationProps,
		inputFormat: InputFormat
	): CommonCartridgeResourceProps | undefined {
		if (!this.isValidOrganization(organization)) {
			return undefined;
		}

		const content = this.archive.readAsText(organization.resourcePath);
		const { title } = organization;

		switch (organization.resourceType) {
			case CommonCartridgeResourceTypeV1P1.WEB_LINK:
				return this.createWebLinkResource(content, title);
			case CommonCartridgeResourceTypeV1P1.WEB_CONTENT:
				return this.createWebContentResource(content, inputFormat);
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
		const document = load(content, { xml: true });
		const url = document('webLink > url').attr('href') ?? '';

		return {
			type: CommonCartridgeResourceTypeV1P1.WEB_LINK,
			title,
			url,
		};
	}

	private createWebContentResource(
		content: string,
		inputFormat: InputFormat
	): CommonCartridgeWebContentResourceProps | undefined {
		const html = sanitizeRichText(content, inputFormat);

		return {
			type: CommonCartridgeResourceTypeV1P1.WEB_CONTENT,
			html,
		};
	}
}
