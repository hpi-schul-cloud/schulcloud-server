import { type CommonCartridgeResourceType, CommonCartridgeVersion } from '../common-cartridge.enums';
import { VersionNotSupportedLoggableException } from '../errors';
import { type CommonCartridgeResource } from '../interfaces';
import { type OmitVersionAndFolder } from '../utils';
import {
	type CommonCartridgeManifestResourcePropsV110,
	CommonCartridgeResourceFactoryV110,
	type CommonCartridgeWebContentResourcePropsV110,
	type CommonCartridgeWebLinkResourcePropsV110,
} from './v1.1.0';
import { type CommonCartridgeFileResourcePropsV110 } from './v1.1.0/common-cartridge-file-resource';
import {
	type CommonCartridgeManifestResourcePropsV130,
	CommonCartridgeResourceFactoryV130,
	type CommonCartridgeWebContentResourcePropsV130,
	type CommonCartridgeWebLinkResourcePropsV130,
} from './v1.3.0';
import { type CommonCartridgeFileFolderResourcePropsV130 } from './v1.3.0/common-cartridge-file-folder-resource';
import { type CommonCartridgeFileResourcePropsV130 } from './v1.3.0/common-cartridge-file-resource';

export type CommonCartridgeResourceProps =
	| OmitVersionAndFolder<CommonCartridgeWebContentResourcePropsV110>
	| OmitVersionAndFolder<CommonCartridgeWebLinkResourcePropsV110>
	| OmitVersionAndFolder<CommonCartridgeWebContentResourcePropsV130>
	| OmitVersionAndFolder<CommonCartridgeWebLinkResourcePropsV130>
	| OmitVersionAndFolder<CommonCartridgeFileResourcePropsV110>
	| OmitVersionAndFolder<CommonCartridgeFileResourcePropsV130>
	| OmitVersionAndFolder<CommonCartridgeFileFolderResourcePropsV130>;

export type CommonCartridgeResourcePropsInternalV110 =
	| CommonCartridgeManifestResourcePropsV110
	| CommonCartridgeWebContentResourcePropsV110
	| CommonCartridgeWebLinkResourcePropsV110
	| CommonCartridgeFileResourcePropsV110
	| { version: CommonCartridgeVersion.V_1_1_0; type: CommonCartridgeResourceType.FILE_FOLDER };

export type CommonCartridgeResourcePropsInternalV130 =
	| CommonCartridgeManifestResourcePropsV130
	| CommonCartridgeWebContentResourcePropsV130
	| CommonCartridgeWebLinkResourcePropsV130
	| CommonCartridgeFileResourcePropsV130
	| CommonCartridgeFileFolderResourcePropsV130;

export type CommonCartridgeResourcePropsInternal =
	| CommonCartridgeResourcePropsInternalV110
	| CommonCartridgeResourcePropsInternalV130;

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
