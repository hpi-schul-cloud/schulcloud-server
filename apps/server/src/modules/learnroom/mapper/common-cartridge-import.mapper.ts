import { ContentElementType } from '@modules/board';
import { AnyElementContentBody, LinkContentBody, RichTextContentBody } from '@modules/board/controller/dto';
import { Injectable } from '@nestjs/common';
import { InputFormat } from '@shared/domain/types';
import { CommonCartridgeResourceTypeV1P1 } from '@src/modules/common-cartridge';
import {
	CommonCartridgeResourceProps,
	CommonCartridgeWebContentResourceProps,
	CommonCartridgeWebLinkResourceProps,
} from '@src/modules/common-cartridge/import/common-cartridge-import.types';

@Injectable()
export class CommonCartridgeImportMapper {
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

	public mapResourceToContentElementBody(resource: CommonCartridgeResourceProps): AnyElementContentBody {
		switch (resource.type) {
			case CommonCartridgeResourceTypeV1P1.WEB_LINK:
				return this.createLinkContentElementBody(resource);
			case CommonCartridgeResourceTypeV1P1.WEB_CONTENT:
				return this.createWebContentElementBody(resource);
			default:
				throw new Error('Resource type not supported');
		}
	}

	private createLinkContentElementBody(resource: CommonCartridgeWebLinkResourceProps): AnyElementContentBody {
		const body = new LinkContentBody();

		body.title = resource.title;
		body.url = resource.url;

		return body;
	}

	private createWebContentElementBody(resource: CommonCartridgeWebContentResourceProps): AnyElementContentBody {
		const body = new RichTextContentBody();

		body.text = resource.html;
		body.inputFormat = InputFormat.RICH_TEXT_CK5_SIMPLE;

		return body;
	}
}
