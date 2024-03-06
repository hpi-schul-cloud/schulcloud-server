import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';
import { OmitVersionAndFolder, createVersionNotSupportedError } from '../utils';
import { CommonCartridgeElementFactoryV110 } from './v1.1.0/common-cartridge-element-factory';
import { CommonCartridgeMetadataElementPropsV110 } from './v1.1.0/common-cartridge-metadata-element';
import { CommonCartridgeOrganizationElementPropsV110 } from './v1.1.0/common-cartridge-organization-element';
import { CommonCartridgeOrganizationsWrapperElementPropsV110 } from './v1.1.0/common-cartridge-organizations-wrapper-element';
import { CommonCartridgeResourcesWrapperElementPropsV110 } from './v1.1.0/common-cartridge-resources-wrapper-element';
import { CommonCartridgeElementFactoryV130 } from './v1.3.0/common-cartridge-element-factory';
import { CommonCartridgeMetadataElementPropsV130 } from './v1.3.0/common-cartridge-metadata-element';
import { CommonCartridgeOrganizationElementPropsV130 } from './v1.3.0/common-cartridge-organization-element';
import { CommonCartridgeOrganizationsWrapperElementPropsV130 } from './v1.3.0/common-cartridge-organizations-wrapper-element';
import { CommonCartridgeResourcesWrapperElementPropsV130 } from './v1.3.0/common-cartridge-resources-wrapper-element';

export type CommonCartridgeElementProps =
	| OmitVersionAndFolder<CommonCartridgeMetadataElementPropsV110>
	| OmitVersionAndFolder<CommonCartridgeOrganizationElementPropsV110>
	| OmitVersionAndFolder<CommonCartridgeOrganizationsWrapperElementPropsV110>
	| OmitVersionAndFolder<CommonCartridgeResourcesWrapperElementPropsV110>
	| OmitVersionAndFolder<CommonCartridgeMetadataElementPropsV130>
	| OmitVersionAndFolder<CommonCartridgeOrganizationElementPropsV130>
	| OmitVersionAndFolder<CommonCartridgeOrganizationsWrapperElementPropsV130>
	| OmitVersionAndFolder<CommonCartridgeResourcesWrapperElementPropsV130>;

type CommonCartridgeElementPropsInternal =
	| CommonCartridgeMetadataElementPropsV110
	| CommonCartridgeOrganizationElementPropsV110
	| CommonCartridgeOrganizationsWrapperElementPropsV110
	| CommonCartridgeResourcesWrapperElementPropsV110
	| CommonCartridgeMetadataElementPropsV130
	| CommonCartridgeOrganizationElementPropsV130
	| CommonCartridgeOrganizationsWrapperElementPropsV130
	| CommonCartridgeResourcesWrapperElementPropsV130;

export class CommonCartridgeElementFactory {
	public static createElement(props: CommonCartridgeElementPropsInternal): CommonCartridgeElement {
		const { version } = props;

		switch (version) {
			case CommonCartridgeVersion.V_1_1_0:
				return CommonCartridgeElementFactoryV110.createElement(props);
			case CommonCartridgeVersion.V_1_3_0:
				return CommonCartridgeElementFactoryV130.createElement(props);
			default:
				throw createVersionNotSupportedError(version);
		}
	}
}
