import { ContentElementType } from '../generated';
import { CommonCartridgeResourceTypeV1P1 } from './common-cartridge-import.enums';

export class CommonCartridgeImportMapper {
	public static mapResourceTypeToContentElementType(
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
}
