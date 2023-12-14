import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import { createVersionNotSupportedError } from '../utils';
import {
	CommonCartridgeResourceFactoryV110,
	CommonCartridgeResourcePropsV110,
} from './v1.1.0/common-cartridge-resource-factory';
import {
	CommonCartridgeResourceFactoryV130,
	CommonCartridgeResourcePropsV130,
} from './v1.3.0/common-cartridge-resource-factory';

export type CommonCartridgeResourceProps = CommonCartridgeResourcePropsV110 | CommonCartridgeResourcePropsV130;

export class CommonCartridgeResourceVersionFactory {
	public static createFactory(props: CommonCartridgeResourceProps): CommonCartridgeResource {
		const { version } = props;

		switch (version) {
			case CommonCartridgeVersion.V_1_1_0:
				return CommonCartridgeResourceFactoryV110.getInstance().createResource(props);
			case CommonCartridgeVersion.V_1_3_0:
				return CommonCartridgeResourceFactoryV130.getInstance().createResource(props);
			default:
				throw createVersionNotSupportedError(version);
		}
	}
}
