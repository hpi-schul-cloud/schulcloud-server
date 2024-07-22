import { CommonCartridgeVersion } from '../../common-cartridge.enums';
import {
	CommonCartridgeResourcesWrapperElement,
	CommonCartridgeResourcesWrapperElementProps,
} from '../abstract/common-cartridge-resources-wrapper-element';

export type CommonCartridgeResourcesWrapperElementPropsV130 = CommonCartridgeResourcesWrapperElementProps;

export class CommonCartridgeResourcesWrapperElementV130 extends CommonCartridgeResourcesWrapperElement {
	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_3_0;
	}
}
