import {
	CommonCartridgeOrganizationsWrapperElement,
	CommonCartridgeOrganizationsWrapperElementProps,
} from '../abstract/common-cartridge-organizations-wrapper-element';
import { CommonCartridgeVersion } from '../../common-cartridge.enums';

export type CommonCartridgeOrganizationsWrapperElementPropsV130 = CommonCartridgeOrganizationsWrapperElementProps;

export class CommonCartridgeOrganizationsWrapperElementV130 extends CommonCartridgeOrganizationsWrapperElement {
	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_3_0;
	}
}
