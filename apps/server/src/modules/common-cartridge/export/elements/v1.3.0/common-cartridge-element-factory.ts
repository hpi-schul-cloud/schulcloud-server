import { CommonCartridgeElementType } from '../../common-cartridge.enums';
import { CommonCartridgeElement } from '../../interfaces';
import { createElementTypeNotSupportedError } from '../../utils';
import {
	CommonCartridgeMetadataElementPropsV130,
	CommonCartridgeMetadataElementV130,
} from './common-cartridge-metadata-element';
import {
	CommonCartridgeOrganizationElementPropsV130,
	CommonCartridgeOrganizationElementV130,
} from './common-cartridge-organization-element';
import {
	CommonCartridgeOrganizationsWrapperElementPropsV130,
	CommonCartridgeOrganizationsWrapperElementV130,
} from './common-cartridge-organizations-wrapper-element';
import {
	CommonCartridgeResourcesWrapperElementPropsV130,
	CommonCartridgeResourcesWrapperElementV130,
} from './common-cartridge-resources-wrapper-element';

type CommonCartridgeElementProps130 =
	| CommonCartridgeMetadataElementPropsV130
	| CommonCartridgeOrganizationElementPropsV130
	| CommonCartridgeOrganizationsWrapperElementPropsV130
	| CommonCartridgeResourcesWrapperElementPropsV130;

export class CommonCartridgeElementFactoryV130 {
	public static createElement(props: CommonCartridgeElementProps130): CommonCartridgeElement {
		const { type } = props;

		switch (type) {
			// AI next 8 lines
			case CommonCartridgeElementType.METADATA:
				return new CommonCartridgeMetadataElementV130(props);
			case CommonCartridgeElementType.ORGANIZATION:
				return new CommonCartridgeOrganizationElementV130(props);
			case CommonCartridgeElementType.ORGANIZATIONS_WRAPPER:
				return new CommonCartridgeOrganizationsWrapperElementV130(props);
			case CommonCartridgeElementType.RESOURCES_WRAPPER:
				return new CommonCartridgeResourcesWrapperElementV130(props);
			default:
				throw createElementTypeNotSupportedError(type);
		}
	}
}
