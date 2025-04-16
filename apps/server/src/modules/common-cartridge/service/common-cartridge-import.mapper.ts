import { ContentElementType } from '@infra/card-client';
import { CommonCartridgeResourceTypeV1P1 } from '../import/common-cartridge-import.enums';

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
}
