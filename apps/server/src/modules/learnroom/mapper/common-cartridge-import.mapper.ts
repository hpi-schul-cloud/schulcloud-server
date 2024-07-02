import { AnyElementContentBody, ContentElementType, LinkContentBody, RichTextContentBody } from '@modules/board';
import {
	CommonCartridgeImportResourceProps,
	CommonCartridgeImportWebContentResourceProps,
	CommonCartridgeImportWebLinkResourceProps,
	CommonCartridgeOrganizationProps,
	CommonCartridgeResourceTypeV1P1,
} from '@modules/common-cartridge';
import { Injectable } from '@nestjs/common';
import { InputFormat } from '@shared/domain/types';

@Injectable()
export class CommonCartridgeImportMapper {
	public mapOrganizationToColumn(organization: CommonCartridgeOrganizationProps) {
		return {
			title: organization.title,
		};
	}

	public mapOrganizationToCard(organization: CommonCartridgeOrganizationProps, withTitle = true) {
		return {
			title: withTitle ? organization.title : '',
			height: 150,
		};
	}

	public mapOrganizationToTextElement(organization: CommonCartridgeOrganizationProps): AnyElementContentBody {
		const body = new RichTextContentBody();
		body.text = `<b>${organization.title}</b>`;
		body.inputFormat = InputFormat.RICH_TEXT_CK5_SIMPLE;

		return body;
	}

	public mapResourceTypeToContentElementType(
		resourceType: CommonCartridgeResourceTypeV1P1 | undefined
	): ContentElementType | undefined {
		switch (resourceType) {
			case CommonCartridgeResourceTypeV1P1.WEB_LINK:
				return ContentElementType.LINK;
			case CommonCartridgeResourceTypeV1P1.WEB_CONTENT:
				return ContentElementType.RICH_TEXT;
			default:
				return undefined;
		}
	}

	public mapResourceToContentElementBody(resource: CommonCartridgeImportResourceProps): AnyElementContentBody {
		switch (resource.type) {
			case CommonCartridgeResourceTypeV1P1.WEB_LINK:
				return this.createLinkContentElementBody(resource);
			case CommonCartridgeResourceTypeV1P1.WEB_CONTENT:
				return this.createWebContentElementBody(resource);
			default:
				throw new Error('Resource type not supported');
		}
	}

	private createLinkContentElementBody(resource: CommonCartridgeImportWebLinkResourceProps): AnyElementContentBody {
		const body = new LinkContentBody();

		body.title = resource.title;
		body.url = resource.url;

		return body;
	}

	private createWebContentElementBody(resource: CommonCartridgeImportWebContentResourceProps): AnyElementContentBody {
		const body = new RichTextContentBody();

		body.text = resource.html;
		body.inputFormat = InputFormat.RICH_TEXT_CK5_SIMPLE;

		return body;
	}
}
