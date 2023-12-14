import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { createVersionNotSupportedError } from '../utils';
import { CommonCartridgeElementFactoryV110 } from './v1.1.0/common-cartridge-element-factory';
import { CommonCartridgeElementFactoryV130 } from './v1.3.0/common-cartridge-element-factory';

export class CommonCartridgeElementVersionFactory {
	public static createFactory(
		version: CommonCartridgeVersion
	): CommonCartridgeElementFactoryV110 | CommonCartridgeElementFactoryV130 {
		switch (version) {
			case CommonCartridgeVersion.V_1_1_0:
				return CommonCartridgeElementFactoryV110.getInstance();
			case CommonCartridgeVersion.V_1_3_0:
				return CommonCartridgeElementFactoryV130.getInstance();
			default:
				throw createVersionNotSupportedError(version);
		}
	}
}
