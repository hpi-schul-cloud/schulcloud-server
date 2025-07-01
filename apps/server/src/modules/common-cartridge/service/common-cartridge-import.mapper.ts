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
	CommonCartridgeWebLinkResourceV3Props,
} from '../import/common-cartridge-import.types';

export class CommonCartridgeImportMapper {
	public mapResourceTypeToContentElementType(
		resourceType: CommonCartridgeResourceTypeV1P1 | undefined
	): ContentElementType | undefined {
		switch (resourceType) {
			case CommonCartridgeResourceTypeV1P1.WEB_LINK_v1:
			case CommonCartridgeResourceTypeV1P1.WEB_LINK_v3:
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
		cardElementProps: CommonCartridgeImportOrganizationProps,
		inputFormat: InputFormat
	): LinkElementContentBody | RichTextElementContentBody | FileElementContentBody | undefined {
		if (resource.type === CommonCartridgeResourceTypeV1P1.WEB_LINK_v1) {
			const linkContentBody = this.createLinkFromResourceV1(resource);

			return linkContentBody;
		}

		if (resource.type === CommonCartridgeResourceTypeV1P1.WEB_LINK_v3) {
			const linkContentBody = this.createLinkFromResourceV3(resource);

			return linkContentBody;
		}

		if (
			resource.type === CommonCartridgeResourceTypeV1P1.WEB_CONTENT &&
			cardElementProps.resourcePath.endsWith('.html')
		) {
			const richTextBody = this.createTextFromHtmlResource(resource, inputFormat);

			return richTextBody;
		}

		if (resource.type === CommonCartridgeResourceTypeV1P1.FILE) {
			const fileContentBody: FileElementContentBody = this.createFileFromResource(resource);

			return fileContentBody;
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

	private createLinkFromResourceV1(resource: CommonCartridgeWebLinkResourceProps): LinkElementContentBody {
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

	private createLinkFromResourceV3(resource: CommonCartridgeWebLinkResourceV3Props): LinkElementContentBody {
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
}
