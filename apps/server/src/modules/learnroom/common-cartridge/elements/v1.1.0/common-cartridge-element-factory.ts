import { CommonCartridgeElementType } from '../../common-cartridge.enums';
import { CommonCartridgeElementFactory } from '../../interfaces/common-cartridge-element-factory.interface';
import { CommonCartridgeElement } from '../../interfaces/common-cartridge-element.interface';
import { createElementTypeNotSupportedError } from '../../utils';
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

export type CommonCartridgeElementProps =
	| CommonCartridgeMetadataElementPropsV110
	| CommonCartridgeOrganizationElementPropsV110
	| CommonCartridgeOrganizationsWrapperElementPropsV110
	| CommonCartridgeResourcesWrapperElementPropsV110;

export class CommonCartridgeElementFactoryV110 extends CommonCartridgeElementFactory {
	public static readonly instance = new CommonCartridgeElementFactoryV110();

	public static getInstance(): CommonCartridgeElementFactory {
		return this.instance;
	}

	public createElement(props: CommonCartridgeElementProps): CommonCartridgeElement {
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
				throw createElementTypeNotSupportedError(type);
		}
	}
}
