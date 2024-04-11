import { Injectable } from '@nestjs/common';
import { CardInitProps, ColumnInitProps, ContentElementType } from '@shared/domain/domainobject';
import { AnyElementContentBody, LinkContentBody } from '@src/modules/board/controller/dto';
import { CommonCartridgeResourceTypeV1P1, OrganizationProps } from '@src/modules/common-cartridge';
import {
	CommonCartridgeResourceProps,
	CommonCartridgeWebLinkResourceProps,
} from '@src/modules/common-cartridge/import/common-cartridge-import.types';

@Injectable()
export class CommonCartridgeImportMapper {
	public mapOrganizationToColumn(organization: OrganizationProps): ColumnInitProps {
		return {
			title: organization.title,
		};
	}

	public mapOrganizationToCard(organization: OrganizationProps): CardInitProps {
		return {
			title: organization.title,
			height: 150,
		};
	}

	public mapResourceTypeToContentElementType(
		resourceType: CommonCartridgeResourceTypeV1P1 | undefined
	): ContentElementType | undefined {
		switch (resourceType) {
			case CommonCartridgeResourceTypeV1P1.WEB_LINK:
				return ContentElementType.LINK;
			default:
				return undefined;
		}
	}

	public mapResourceToContentElementBody(resource: CommonCartridgeResourceProps): AnyElementContentBody {
		switch (resource.type) {
			case CommonCartridgeResourceTypeV1P1.WEB_LINK:
				return this.createLinkContentElementBody(resource);
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
}
