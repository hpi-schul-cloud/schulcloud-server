import { CommonCartridgeResourceType } from '../../common-cartridge.enums';
import { ResourceTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeResource } from '../../interfaces';
import {
	CommonCartridgeFileResourcePropsV130,
	CommonCartridgeFileResourceV130,
} from './common-cartridge-file-resource';
import {
	CommonCartridgeManifestResourcePropsV130,
	CommonCartridgeManifestResourceV130,
} from './common-cartridge-manifest-resource';
import {
	CommonCartridgeWebContentResourcePropsV130,
	CommonCartridgeWebContentResourceV130,
} from './common-cartridge-web-content-resource';
import {
	CommonCartridgeWebLinkResourcePropsV130,
	CommonCartridgeWebLinkResourceV130,
} from './common-cartridge-web-link-resource';

type CommonCartridgeResourcePropsV130 =
	| CommonCartridgeManifestResourcePropsV130
	| CommonCartridgeWebContentResourcePropsV130
	| CommonCartridgeWebLinkResourcePropsV130
	| CommonCartridgeFileResourcePropsV130;

export class CommonCartridgeResourceFactoryV130 {
	public static createResource(props: CommonCartridgeResourcePropsV130): CommonCartridgeResource {
		const { type } = props;

		switch (type) {
			case CommonCartridgeResourceType.MANIFEST:
				return new CommonCartridgeManifestResourceV130(props);
			case CommonCartridgeResourceType.WEB_CONTENT:
				return new CommonCartridgeWebContentResourceV130(props);
			case CommonCartridgeResourceType.WEB_LINK:
				return new CommonCartridgeWebLinkResourceV130(props);
			case CommonCartridgeResourceType.FILE:
				return new CommonCartridgeFileResourceV130(props);
			default:
				throw new ResourceTypeNotSupportedLoggableException(type);
		}
	}
}
