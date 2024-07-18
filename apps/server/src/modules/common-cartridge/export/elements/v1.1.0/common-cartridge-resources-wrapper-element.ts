import { CommonCartridgeVersion } from '../../common-cartridge.enums';
import {
	CommonCartridgeResourcesWrapperElement,
	CommonCartridgeResourcesWrapperElementProps,
} from '../abstract/common-cartridge-resources-wrapper-element';

export type CommonCartridgeResourcesWrapperElementPropsV110 = CommonCartridgeResourcesWrapperElementProps;

export class CommonCartridgeResourcesWrapperElementV110 extends CommonCartridgeResourcesWrapperElement {
	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}
}
