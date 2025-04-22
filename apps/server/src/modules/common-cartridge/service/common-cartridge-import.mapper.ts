import {
	ContentElementType,
	LinkElementContentBody,
	RichTextElementContentBody,
	UpdateElementContentBodyParamsData,
} from '@infra/cards-client';
import { InputFormat } from '@shared/domain/types';
import {
	CommonCartridgeImportOrganizationProps,
	CommonCartridgeImportResourceProps,
	CommonCartridgeImportWebContentResourceProps,
} from '..';
import { CommonCartridgeResourceTypeV1P1 } from '../import/common-cartridge-import.enums';
import { CommonCartridgeWebLinkResourceProps } from '../import/common-cartridge-import.types';

export class CommonCartridgeImportMapper {
	public mapResourceTypeToContentElementType(
		resourceType: CommonCartridgeResourceTypeV1P1 | undefined
	): ContentElementType | undefined {
		switch (resourceType) {
			case CommonCartridgeResourceTypeV1P1.WEB_LINK:
				return 'link';
			case CommonCartridgeResourceTypeV1P1.WEB_CONTENT:
				return 'richText';
			default:
				return undefined;
		}
	}

	public mapToResourceBody(
		resource: CommonCartridgeImportResourceProps,
		cardElementProps: CommonCartridgeImportOrganizationProps
	): UpdateElementContentBodyParamsData | undefined {
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
}
