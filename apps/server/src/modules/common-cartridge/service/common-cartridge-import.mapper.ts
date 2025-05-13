import {
	ContentElementType,
	FileElementContentBody,
	LinkElementContentBody,
	RichTextElementContentBody,
} from '@infra/cards-client';
import { InputFormat } from '@shared/domain/types';
import {
	CommonCartridgeImportOrganizationProps,
	CommonCartridgeImportResourceProps,
	CommonCartridgeImportWebContentResourceProps,
} from '..';
import { CommonCartridgeResourceTypeV1P1 } from '../import/common-cartridge-import.enums';
import {
	CommonCartridgeFileResourceProps,
	CommonCartridgeWebLinkResourceProps,
} from '../import/common-cartridge-import.types';

export class CommonCartridgeImportMapper {
	public mapResourceTypeToContentElementType(
		resourceType: CommonCartridgeResourceTypeV1P1 | undefined
	): ContentElementType | undefined {
		switch (resourceType) {
			case CommonCartridgeResourceTypeV1P1.WEB_LINK:
				return 'link';
			case CommonCartridgeResourceTypeV1P1.WEB_CONTENT:
				return 'richText';
			case CommonCartridgeResourceTypeV1P1.FILE:
				return 'file';
			default:
				return undefined;
		}
	}

	public mapResourceToContentBody(
		resource: CommonCartridgeImportResourceProps,
		cardElementProps: CommonCartridgeImportOrganizationProps
	): LinkElementContentBody | RichTextElementContentBody | FileElementContentBody | undefined {
		if (resource.type === CommonCartridgeResourceTypeV1P1.WEB_LINK) {
			const linkContentBody: LinkElementContentBody = this.createLinkFromResource(resource);

			return linkContentBody;
		}

		if (
			resource.type === CommonCartridgeResourceTypeV1P1.WEB_CONTENT &&
			cardElementProps.resourcePath.endsWith('.html')
		) {
			const richTextBody: RichTextElementContentBody = this.createTextFromHtmlResource(resource);

			return richTextBody;
		}

		if (resource.type === CommonCartridgeResourceTypeV1P1.FILE) {
			const fileContentBody: FileElementContentBody = this.createFileFromResource(resource);

			return fileContentBody;
		}

		return undefined;
	}

	private createTextFromHtmlResource(
		resource: CommonCartridgeImportWebContentResourceProps
	): RichTextElementContentBody {
		const richTextBody: RichTextElementContentBody = {
			type: 'richText',
			content: {
				inputFormat: InputFormat.RICH_TEXT_CK4, // TODO use config
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
				caption: resource.fileName,
				alternativeText: '',
			},
		};

		return fileBody;
	}
}
