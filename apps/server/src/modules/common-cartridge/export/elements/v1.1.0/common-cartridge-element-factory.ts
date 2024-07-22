import { CommonCartridgeElementType } from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeElement } from '../../interfaces';
import {
	CommonCartridgeMetadataElementPropsV110,
	CommonCartridgeMetadataElementV110,
} from './common-cartridge-metadata-element';
import {
	CommonCartridgeOrganizationElementPropsV110,
	CommonCartridgeOrganizationElementV110,
} from './common-cartridge-organization-element';
import {
	CommonCartridgeOrganizationsWrapperElementPropsV110,
	CommonCartridgeOrganizationsWrapperElementV110,
} from './common-cartridge-organizations-wrapper-element';
import {
	CommonCartridgeResourcesWrapperElementPropsV110,
	CommonCartridgeResourcesWrapperElementV110,
} from './common-cartridge-resources-wrapper-element';

type CommonCartridgeElementPropsV110 =
	| CommonCartridgeMetadataElementPropsV110
	| CommonCartridgeOrganizationElementPropsV110
	| CommonCartridgeOrganizationsWrapperElementPropsV110
	| CommonCartridgeResourcesWrapperElementPropsV110;

export class CommonCartridgeElementFactoryV110 {
	public static createElement(props: CommonCartridgeElementPropsV110): CommonCartridgeElement {
		const { type } = props;

		switch (type) {
			// AI next 8 lines
			case CommonCartridgeElementType.METADATA:
				return new CommonCartridgeMetadataElementV110(props);
			case CommonCartridgeElementType.ORGANIZATION:
				return new CommonCartridgeOrganizationElementV110(props);
			case CommonCartridgeElementType.ORGANIZATIONS_WRAPPER:
				return new CommonCartridgeOrganizationsWrapperElementV110(props);
			case CommonCartridgeElementType.RESOURCES_WRAPPER:
				return new CommonCartridgeResourcesWrapperElementV110(props);
			default:
				throw new ElementTypeNotSupportedLoggableException(type);
		}
	}
}
