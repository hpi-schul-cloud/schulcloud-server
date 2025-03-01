import { CommonCartridgeResourceType } from '../../common-cartridge.enums';
import { ResourceTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeResource } from '../../interfaces';
import {
	CommonCartridgeFileResourcePropsV110,
	CommonCartridgeFileResourceV110,
} from './common-cartridge-file-resource';
import {
	CommonCartridgeManifestResourcePropsV110,
	CommonCartridgeManifestResourceV110,
} from './common-cartridge-manifest-resource';
import {
	CommonCartridgeWebContentResourcePropsV110,
	CommonCartridgeWebContentResourceV110,
} from './common-cartridge-web-content-resource';
import {
	CommonCartridgeWebLinkResourcePropsV110,
	CommonCartridgeWebLinkResourceV110,
} from './common-cartridge-web-link-resource';

type CommonCartridgeResourcePropsV110 =
	| CommonCartridgeManifestResourcePropsV110
	| CommonCartridgeWebContentResourcePropsV110
	| CommonCartridgeWebLinkResourcePropsV110
	| CommonCartridgeFileResourcePropsV110;

export class CommonCartridgeResourceFactoryV110 {
	public static createResource(props: CommonCartridgeResourcePropsV110): CommonCartridgeResource {
		const { type } = props;

		switch (type) {
			case CommonCartridgeResourceType.MANIFEST:
				return new CommonCartridgeManifestResourceV110(props);
			case CommonCartridgeResourceType.WEB_CONTENT:
				return new CommonCartridgeWebContentResourceV110(props);
			case CommonCartridgeResourceType.WEB_LINK:
				return new CommonCartridgeWebLinkResourceV110(props);
			case CommonCartridgeResourceType.FILE:
				return new CommonCartridgeFileResourceV110(props);
			default:
				throw new ResourceTypeNotSupportedLoggableException(type);
		}
	}
}
