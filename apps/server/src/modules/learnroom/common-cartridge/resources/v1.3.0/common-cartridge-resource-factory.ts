import { CommonCartridgeResourceType } from '../../common-cartridge.enums';
import { CommonCartridgeResourceFactory } from '../../interfaces/common-cartridge-resource-factory.interface';
import { CommonCartridgeResource } from '../../interfaces/common-cartridge-resource.interface';
import { createResourceTypeNotSupportedError } from '../../utils';
import { CommonCartridgeLtiResourcePropsV130, CommonCartridgeLtiResourceV130 } from './common-cartridge-lti-resource';
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

export type CommonCartridgeResourcePropsV130 =
	| CommonCartridgeLtiResourcePropsV130
	| CommonCartridgeManifestResourcePropsV130
	| CommonCartridgeWebContentResourcePropsV130
	| CommonCartridgeWebLinkResourcePropsV130;

export class CommonCartridgeResourceFactoryV130 extends CommonCartridgeResourceFactory {
	public static readonly instance = new CommonCartridgeResourceFactoryV130();

	public static getInstance(): CommonCartridgeResourceFactory {
		return this.instance;
	}

	public override createResource(props: CommonCartridgeResourcePropsV130): CommonCartridgeResource {
		const { type } = props;

		switch (type) {
			case CommonCartridgeResourceType.LTI:
				return new CommonCartridgeLtiResourceV130(props);
			case CommonCartridgeResourceType.MANIFEST:
				return new CommonCartridgeManifestResourceV130(props);
			case CommonCartridgeResourceType.WEB_CONTENT:
				return new CommonCartridgeWebContentResourceV130(props);
			case CommonCartridgeResourceType.WEB_LINK:
				return new CommonCartridgeWebLinkResourceV130(props);
			default:
				throw createResourceTypeNotSupportedError(type);
		}
	}
}
