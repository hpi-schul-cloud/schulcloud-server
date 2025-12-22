import {
	ContentElementType,
	FileElementContentBody,
	FileFolderElementContentBody,
	LinkElementContentBody,
	RichTextElementContentBody,
} from '@infra/cards-client';
import { InputFormat } from '@shared/domain/types';
import { load } from 'cheerio';
import { CommonCartridgeImportResourceProps, CommonCartridgeImportWebContentResourceProps } from '..';
import { CommonCartridgeXmlResourceType } from '../import/common-cartridge-import.enums';
import {
	CommonCartridgeFileFolderResourceProps,
	CommonCartridgeFileResourceProps,
	CommonCartridgeWebLinkResourceProps,
} from '../import/common-cartridge-import.types';

export class CommonCartridgeImportMapper {
	public mapResourceTypeToContentElementType(
		resourceType: CommonCartridgeXmlResourceType | undefined
	): ContentElementType | undefined {
		switch (resourceType) {
			case CommonCartridgeXmlResourceType.WEB_LINK_CC11:
			case CommonCartridgeXmlResourceType.WEB_LINK_CC13:
				return 'link';
			case CommonCartridgeXmlResourceType.WEB_CONTENT:
				return 'richText';
			case CommonCartridgeXmlResourceType.FILE:
				return 'file';
			case CommonCartridgeXmlResourceType.FILE_FOLDER:
				return 'fileFolder';
			default:
				return undefined;
		}
	}

	public mapResourceToContentBody(
		resource: CommonCartridgeImportResourceProps,
		inputFormat: InputFormat
	):
		| LinkElementContentBody
		| RichTextElementContentBody
		| FileElementContentBody
		| FileFolderElementContentBody
		| undefined {
		if (
			resource.type === CommonCartridgeXmlResourceType.WEB_LINK_CC11 ||
			resource.type === CommonCartridgeXmlResourceType.WEB_LINK_CC13
		) {
			const linkContentBody = this.createLinkFromResource(resource);

			return linkContentBody;
		}

		if (resource.type === CommonCartridgeXmlResourceType.WEB_CONTENT) {
			const richTextBody = this.createTextFromHtmlResource(resource, inputFormat);

			return richTextBody;
		}

		if (resource.type === CommonCartridgeXmlResourceType.FILE) {
			const fileContentBody: FileElementContentBody = this.createFileFromResource(resource);

			return fileContentBody;
		}

		if (resource.type === CommonCartridgeXmlResourceType.FILE_FOLDER) {
			const fileFolderContentBody = this.createFileFolderFromResource(resource);

			return fileFolderContentBody;
		}

		return undefined;
	}

	private createTextFromHtmlResource(
		resource: CommonCartridgeImportWebContentResourceProps,
		inputFormat: InputFormat
	): RichTextElementContentBody {
		const content = load(resource.html);
		content('h1, h2, h3').replaceWith((_, e) => `<h4>${content(e).html() ?? ''}</h4>`);
		content('h6').replaceWith((_, e) => `<h5>${content(e).html() ?? ''}</h5>`);

		const richTextBody: RichTextElementContentBody = {
			type: 'richText',
			content: {
				inputFormat,
				text: content.html(),
			},
		};

		return richTextBody;
	}

	private createLinkFromResource(resource: CommonCartridgeWebLinkResourceProps): LinkElementContentBody {
		const linkBody: LinkElementContentBody = {
			content: {
				title: resource.title ?? resource.url,
				url: resource.url,
				description: '',
				imageUrl: '',
				originalImageUrl: '',
			},
			type: 'link',
		};

		return linkBody;
	}

	private createFileFromResource(resource: CommonCartridgeFileResourceProps): FileElementContentBody {
		const fileBody: FileElementContentBody = {
			type: 'file',
			content: {
				caption: resource.description,
				alternativeText: '',
			},
		};

		return fileBody;
	}

	private createFileFolderFromResource(resource: CommonCartridgeFileFolderResourceProps): FileFolderElementContentBody {
		const fileFolderBody: FileFolderElementContentBody = {
			type: 'fileFolder',
			content: {
				title: resource.title,
			},
		};

		return fileFolderBody;
	}
}
