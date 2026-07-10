import {
	type ContentElementType,
	type FileElementContentBody,
	type FileFolderElementContentBody,
	type LinkElementContentBody,
	type RichTextElementContentBody,
} from '@infra/common-cartridge-clients';
import { type InputFormat } from '@shared/domain/types';
import { type CommonCartridgeImportResourceProps, type CommonCartridgeImportWebContentResourceProps } from '..';
import { CommonCartridgeXmlResourceType } from '../import/common-cartridge-import.enums';
import {
	type CommonCartridgeFileFolderResourceProps,
	type CommonCartridgeFileResourceProps,
	type CommonCartridgeWebLinkResourceProps,
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
		const richTextBody: RichTextElementContentBody = {
			type: 'richText',
			content: {
				inputFormat,
				text: resource.html,
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
