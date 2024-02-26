import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import { OmitVersionAndFolder, createVersionNotSupportedError } from '../utils';
import { CommonCartridgeManifestResourcePropsV110 } from './v1.1.0/common-cartridge-manifest-resource';
import { CommonCartridgeResourceFactoryV110 } from './v1.1.0/common-cartridge-resource-factory';
import { CommonCartridgeWebContentResourcePropsV110 } from './v1.1.0/common-cartridge-web-content-resource';
import { CommonCartridgeWebLinkResourcePropsV110 } from './v1.1.0/common-cartridge-web-link-resource';
import { CommonCartridgeManifestResourcePropsV130 } from './v1.3.0/common-cartridge-manifest-resource';
import { CommonCartridgeResourceFactoryV130 } from './v1.3.0/common-cartridge-resource-factory';
import { CommonCartridgeWebContentResourcePropsV130 } from './v1.3.0/common-cartridge-web-content-resource';
import { CommonCartridgeWebLinkResourcePropsV130 } from './v1.3.0/common-cartridge-web-link-resource';

export type CommonCartridgeResourceProps =
	| OmitVersionAndFolder<CommonCartridgeWebContentResourcePropsV110>
	| OmitVersionAndFolder<CommonCartridgeWebLinkResourcePropsV110>
	| OmitVersionAndFolder<CommonCartridgeWebContentResourcePropsV130>
	| OmitVersionAndFolder<CommonCartridgeWebLinkResourcePropsV130>;

type CommonCartridgeResourcePropsInternal =
	| CommonCartridgeManifestResourcePropsV110
	| CommonCartridgeWebContentResourcePropsV110
	| CommonCartridgeWebLinkResourcePropsV110
	| CommonCartridgeManifestResourcePropsV130
	| CommonCartridgeWebContentResourcePropsV130
	| CommonCartridgeWebLinkResourcePropsV130;

export class CommonCartridgeResourceFactory {
	public static createResource(props: CommonCartridgeResourcePropsInternal): CommonCartridgeResource | never {
		const { version } = props;

		switch (version) {
			case CommonCartridgeVersion.V_1_1_0:
				return CommonCartridgeResourceFactoryV110.createResource(props);
			case CommonCartridgeVersion.V_1_3_0:
				return CommonCartridgeResourceFactoryV130.createResource(props);
			default:
				throw createVersionNotSupportedError(version);
		}
	}
}
