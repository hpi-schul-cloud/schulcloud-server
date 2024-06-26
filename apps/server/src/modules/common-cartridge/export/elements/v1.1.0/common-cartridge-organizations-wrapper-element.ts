import {
	CommonCartridgeOrganizationsWrapperElement,
	CommonCartridgeOrganizationsWrapperElementProps,
} from '../abstract/common-cartridge-organizations-wrapper-element';
import { CommonCartridgeVersion } from '../../common-cartridge.enums';

export type CommonCartridgeOrganizationsWrapperElementPropsV110 = CommonCartridgeOrganizationsWrapperElementProps;

export class CommonCartridgeOrganizationsWrapperElementV110 extends CommonCartridgeOrganizationsWrapperElement {
	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}
}
