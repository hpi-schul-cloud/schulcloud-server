import { sanitizeRichText } from '@shared/controller/transformer';
import { InputFormat } from '@shared/domain/types';
import AdmZip from 'adm-zip';
import { JSDOM } from 'jsdom';
import { CommonCartridgeResourceTypeV1P1 } from './common-cartridge-import.enums';
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
			case CommonCartridgeResourceTypeV1P1.WEB_LINK:
				return this.createWebLinkResource(content, title);
			case CommonCartridgeResourceTypeV1P1.WEB_CONTENT:
				if (this.isFile(organization.resourcePath)) {
					return this.createFileContentResource(organization.resourcePath, title);
				} else {
					return this.createWebContentResource(content, inputFormat);
				}
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

	private createWebContentResource(
		content: string,
		inputFormat: InputFormat
	): CommonCartridgeWebContentResourceProps | undefined {
		const document = this.tryCreateDocument(content, 'text/html');

		if (!document) {
			return undefined;
		}

		const html = sanitizeRichText(document.body.innerHTML?.trim() ?? '', inputFormat);

		return {
			type: CommonCartridgeResourceTypeV1P1.WEB_CONTENT,
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

	private createFileContentResource(resourcePath: string, title: string): CommonCartridgeFileResourceProps | undefined {
		const fileName = resourcePath.split('/').pop() ?? 'unnamed';
		const zipEntry = this.archive.getEntry(resourcePath);
		const buffer = zipEntry?.getData();

		if (!(buffer instanceof Buffer) || buffer.length === 0) {
			return undefined;
		}

		const file = new File([buffer], fileName, {});

		return {
			type: CommonCartridgeResourceTypeV1P1.FILE,
			href: resourcePath,
			fileName,
			file,
			description: title,
		};
	}

	private isFile(resourcePath: string): boolean {
		return !resourcePath.endsWith('.html');
	}

	private getMimeType(fileName: string): string {
		const mimeType = fileName.split('.').pop()?.toLowerCase();

		if (!mimeType) {
			return 'application/octet-stream';
		}

		switch (mimeType) {
			case 'xml':
				return 'application/xml';
			case 'zip':
				return 'application/zip';
			case 'pdf':
				return 'application/pdf';
			case 'docx':
				return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
			case 'pptx':
				return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
			case 'xlsx':
				return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
			case 'txt':
				return 'text/plain';
			case 'csv':
				return 'text/csv';
			case 'json':
				return 'application/json';
			default:
				return 'application/octet-stream';
		}
	}
}
