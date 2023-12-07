import { CommonCartridgeElementType } from '../../common-cartridge.enums';
import { CommonCartridgeElementFactory } from '../../interfaces/common-cartridge-element-factory.interface';
import { CommonCartridgeElement } from '../../interfaces/common-cartridge-element.interface';
import { createElementTypeNotSupportedError } from '../../utils';
import {
	CommonCartridgeMetadataElement,
	CommonCartridgeMetadataElementProps,
} from './common-cartridge-metadata-element';
import {
	CommonCartridgeOrganizationElement,
	CommonCartridgeOrganizationElementProps,
} from './common-cartridge-organization-element';
import {
	CommonCartridgeOrganizationsWrapperElement,
	CommonCartridgeOrganizationsWrapperElementProps,
} from './common-cartridge-organizations-wrapper-element';
import {
	CommonCartridgeResourcesWrapperElement,
	CommonCartridgeResourcesWrapperElementProps,
} from './common-cartridge-resources-wrapper-element';

export type CommonCartridgeElementProps =
	| CommonCartridgeMetadataElementProps
	| CommonCartridgeOrganizationElementProps
	| CommonCartridgeOrganizationsWrapperElementProps
	| CommonCartridgeResourcesWrapperElementProps;

export class CommonCartridgeElementFactoryV130 extends CommonCartridgeElementFactory {
	public static readonly instance = new CommonCartridgeElementFactoryV130();

	public static getInstance(): CommonCartridgeElementFactory {
		return this.instance;
	}

	public createElement(props: CommonCartridgeElementProps): CommonCartridgeElement {
		const { type } = props;

		switch (type) {
			// AI next 8 lines
			case CommonCartridgeElementType.METADATA:
				return new CommonCartridgeMetadataElement(props);
			case CommonCartridgeElementType.ORGANIZATION:
				return new CommonCartridgeOrganizationElement(props);
			case CommonCartridgeElementType.ORGANIZATIONS_WRAPPER:
				return new CommonCartridgeOrganizationsWrapperElement(props);
			case CommonCartridgeElementType.RESOURCES_WRAPPER:
				return new CommonCartridgeResourcesWrapperElement(props);
			default:
				throw createElementTypeNotSupportedError(type);
		}
	}
}
