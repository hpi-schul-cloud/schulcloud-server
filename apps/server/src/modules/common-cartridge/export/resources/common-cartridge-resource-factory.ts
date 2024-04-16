import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { VersionNotSupportedLoggableException } from '../errors';
import { CommonCartridgeResource } from '../interfaces';
import { OmitVersionAndFolder } from '../utils';
import {
	CommonCartridgeManifestResourcePropsV110,
	CommonCartridgeResourceFactoryV110,
	CommonCartridgeWebContentResourcePropsV110,
	CommonCartridgeWebLinkResourcePropsV110,
} from './v1.1.0';
import {
	CommonCartridgeManifestResourcePropsV130,
	CommonCartridgeResourceFactoryV130,
	CommonCartridgeWebContentResourcePropsV130,
	CommonCartridgeWebLinkResourcePropsV130,
} from './v1.3.0';

export type CommonCartridgeResourceProps =
	| OmitVersionAndFolder<CommonCartridgeWebContentResourcePropsV110>
	| OmitVersionAndFolder<CommonCartridgeWebLinkResourcePropsV110>
	| OmitVersionAndFolder<CommonCartridgeWebContentResourcePropsV130>
	| OmitVersionAndFolder<CommonCartridgeWebLinkResourcePropsV130>;

export type CommonCartridgeResourcePropsInternal =
	| CommonCartridgeManifestResourcePropsV110
	| CommonCartridgeWebContentResourcePropsV110
	| CommonCartridgeWebLinkResourcePropsV110
	| CommonCartridgeManifestResourcePropsV130
	| CommonCartridgeWebContentResourcePropsV130
	| CommonCartridgeWebLinkResourcePropsV130;

export class CommonCartridgeResourceFactory {
	public static createResource(props: CommonCartridgeResourcePropsInternal): CommonCartridgeResource {
		const { version } = props;

		switch (version) {
			case CommonCartridgeVersion.V_1_1_0:
				return CommonCartridgeResourceFactoryV110.createResource(props);
			case CommonCartridgeVersion.V_1_3_0:
				return CommonCartridgeResourceFactoryV130.createResource(props);
			default:
				throw new VersionNotSupportedLoggableException(version);
		}
	}
}
