import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { createVersionNotSupportedError } from '../utils';
import { CommonCartridgeResourceFactoryV110 } from './v1.1.0/common-cartridge-resource-factory';
import { CommonCartridgeResourceFactoryV130 } from './v1.3.0/common-cartridge-resource-factory';

export class CommonCartridgeResourceVersionFactory {
	public static createFactory(
		version: CommonCartridgeVersion
	): CommonCartridgeResourceFactoryV110 | CommonCartridgeResourceFactoryV130 {
		switch (version) {
			case CommonCartridgeVersion.V_1_1_0:
				return CommonCartridgeResourceFactoryV110.getInstance();
			case CommonCartridgeVersion.V_1_3_0:
				return CommonCartridgeResourceFactoryV130.getInstance();
			default:
				throw createVersionNotSupportedError(version);
		}
	}
}
