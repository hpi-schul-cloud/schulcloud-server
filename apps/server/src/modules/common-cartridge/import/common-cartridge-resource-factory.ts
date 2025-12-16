import { sanitizeRichText } from '@shared/controller/transformer';
import { InputFormat } from '@shared/domain/types';
import AdmZip from 'adm-zip';
import { load } from 'cheerio';
import { File as BufferFile } from 'node:buffer';
import { CommonCartridgeXmlResourceType } from './common-cartridge-import.enums';
import {
	CommonCartridgeFileFolderResourceProps,
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

		const { title } = organization;

		switch (organization.resourceType) {
			case CommonCartridgeXmlResourceType.WEB_LINK_CC11:
			case CommonCartridgeXmlResourceType.WEB_LINK_CC13:
				return this.createWebLinkResource(organization.resourcePaths[0], title, organization.resourceType);
			case CommonCartridgeXmlResourceType.WEB_CONTENT:
				return this.buildWebContentResourceFromPath(organization.resourcePaths, inputFormat, title);
			default:
				return undefined;
		}
	}

	private isValidOrganization(organization: CommonCartridgeOrganizationProps): boolean {
		const { isResource, isInlined, resourcePaths } = organization;
		const isValidOrganization = isResource && !isInlined && resourcePaths.length > 0;

		return isValidOrganization;
	}

	private createWebLinkResource(
		resourcePath: string,
		title: string,
		type: CommonCartridgeXmlResourceType.WEB_LINK_CC11 | CommonCartridgeXmlResourceType.WEB_LINK_CC13
	): CommonCartridgeWebLinkResourceProps | undefined {
		const content = this.archive.readAsText(resourcePath);
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
		resourcePaths: string[],
		inputFormat: InputFormat,
		title: string
	): CommonCartridgeResourceProps | undefined {
		if (resourcePaths.length > 1) {
			return this.createFileFolderContentResource(resourcePaths, title);
		} else if (this.isFile(resourcePaths[0])) {
			return this.createFileContentResource(resourcePaths[0], title);
		} else {
			return this.createWebContentResource(resourcePaths[0], inputFormat);
		}
	}

	private isFile(resourcePath: string): boolean {
		return !resourcePath.endsWith('.html');
	}

	private createFileContentResource(resourcePath: string, title: string): CommonCartridgeFileResourceProps | undefined {
		const file = this.resourcePathToFile(resourcePath);
		if (!file) {
			return undefined;
		}

		return {
			type: CommonCartridgeXmlResourceType.FILE,
			href: resourcePath,
			fileName: file.fileName,
			file: file.file,
			description: title,
		};
	}

	private createFileFolderContentResource(
		resourcePaths: string[],
		title: string
	): CommonCartridgeFileFolderResourceProps | undefined {
		const files = resourcePaths
			.map((resourcePath) => this.resourcePathToFile(resourcePath))
			.filter((element) => element !== undefined)
			.map((el) => el.file);

		return {
			type: CommonCartridgeXmlResourceType.FILE_FOLDER,
			title,
			files,
		};
	}

	private getFileNameForResourcePath(resourcePath: string): string {
		return resourcePath.split('/').pop() ?? 'unnamed';
	}

	private resourcePathToFile(resourcePath: string): { file: File; fileName: string } | undefined {
		const fileName = this.getFileNameForResourcePath(resourcePath);
		const zipEntry = this.archive.getEntry(resourcePath);
		const buffer = zipEntry?.getData();

		if (!(buffer instanceof Buffer) || buffer.length === 0) {
			return undefined;
		}

		const bufferFile = new BufferFile([buffer], fileName, {});
		const file = bufferFile as unknown as File;

		return { file, fileName };
	}

	private createWebContentResource(
		resourcePath: string,
		inputFormat: InputFormat
	): CommonCartridgeWebContentResourceProps | undefined {
		const content = this.archive.readAsText(resourcePath);
		const document = load(content);
		const unsanitizedHtml = document('body').html()?.trim() ?? content;
		const sanitizedHtml = sanitizeRichText(unsanitizedHtml, inputFormat);

		return {
			type: CommonCartridgeXmlResourceType.WEB_CONTENT,
			html: sanitizedHtml,
		};
	}
}
