import { sanitizeRichText } from '@shared/controller/transformer';
import { InputFormat } from '@shared/domain/types';
import AdmZip from 'adm-zip';
import { load } from 'cheerio';
import { CommonCartridgeXmlResourceType } from './common-cartridge-import.enums';
import {
	CommonCartridgeFileResourceProps,
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
			case CommonCartridgeXmlResourceType.WEB_LINK_CC11:
			case CommonCartridgeXmlResourceType.WEB_LINK_CC13:
				return this.createWebLinkResource(content, title, organization.resourceType);
			case CommonCartridgeXmlResourceType.WEB_CONTENT:
				return this.buildWebContentResourceFromPath(content, organization.resourcePath, inputFormat, title);
			default:
				return undefined;
		}
	}

	private isValidOrganization(organization: CommonCartridgeOrganizationProps): boolean {
		const { isResource, isInlined, resourcePath } = organization;
		const isValidOrganization = isResource && !isInlined && resourcePath !== '';

		return isValidOrganization;
	}

	private createWebLinkResource(
		content: string,
		title: string,
		type: CommonCartridgeXmlResourceType.WEB_LINK_CC11 | CommonCartridgeXmlResourceType.WEB_LINK_CC13
	): CommonCartridgeWebLinkResourceProps | undefined {
		const document = load(content, { xml: true });
		const url = document('webLink > url').attr('href') ?? '';

		if (url === '') {
			return undefined;
		}

		return {
			type,
			title,
			url,
		};
	}

	private buildWebContentResourceFromPath(
		content: string,
		resourcePath: string,
		inputFormat: InputFormat,
		title: string
	): CommonCartridgeResourceProps | undefined {
		if (this.isFile(resourcePath)) {
			return this.createFileContentResource(resourcePath, title);
		} else {
			return this.createWebContentResource(content, inputFormat);
		}
	}

	private isFile(resourcePath: string): boolean {
		return !resourcePath.endsWith('.html');
	}

	private createFileContentResource(resourcePath: string, title: string): CommonCartridgeFileResourceProps | undefined {
		const fileName = resourcePath.split('/').pop() ?? 'unnamed';
		const zipEntry = this.archive.getEntry(resourcePath);
		const buffer = zipEntry?.getData();

		if (!(buffer instanceof Buffer) || buffer.length === 0) {
			return undefined;
		}

		const file = new File([buffer], fileName, {});

		return {
			type: CommonCartridgeXmlResourceType.FILE,
			href: resourcePath,
			fileName,
			file,
			description: title,
		};
	}

	private createWebContentResource(
		content: string,
		inputFormat: InputFormat
	): CommonCartridgeWebContentResourceProps | undefined {
		const document = load(content);
		const unsanitizedHtml = document('body').html()?.trim() ?? content;
		const sanitizedHtml = sanitizeRichText(unsanitizedHtml, inputFormat);

		return {
			type: CommonCartridgeXmlResourceType.WEB_CONTENT,
			html: sanitizedHtml,
		};
	}
}
