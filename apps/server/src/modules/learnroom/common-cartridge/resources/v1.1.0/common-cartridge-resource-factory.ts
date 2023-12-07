import { CommonCartridgeResourceType } from '../../common-cartridge.enums';
import { CommonCartridgeResourceFactory } from '../../interfaces/common-cartridge-resource-factory.interface';
import { CommonCartridgeResource } from '../../interfaces/common-cartridge-resource.interface';
import { createResourceTypeNotSupportedError } from '../../utils';
import { CommonCartridgeLtiResourcePropsV110, CommonCartridgeLtiResourceV110 } from './common-cartridge-lti-resource';
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

export type CommonCartridgeResourcePropsV110 =
	| CommonCartridgeLtiResourcePropsV110
	| CommonCartridgeManifestResourcePropsV110
	| CommonCartridgeWebContentResourcePropsV110
	| CommonCartridgeWebLinkResourcePropsV110;

export class CommonCartridgeResourceFactoryV110 extends CommonCartridgeResourceFactory {
	public static readonly instance = new CommonCartridgeResourceFactoryV110();

	public static getInstance(): CommonCartridgeResourceFactory {
		return this.instance;
	}

	public override createResource(props: CommonCartridgeResourcePropsV110): CommonCartridgeResource {
		const { type } = props;

		switch (type) {
			case CommonCartridgeResourceType.LTI:
				return new CommonCartridgeLtiResourceV110(props);
			case CommonCartridgeResourceType.MANIFEST:
				return new CommonCartridgeManifestResourceV110(props);
			case CommonCartridgeResourceType.WEB_CONTENT:
				return new CommonCartridgeWebContentResourceV110(props);
			case CommonCartridgeResourceType.WEB_LINK:
				return new CommonCartridgeWebLinkResourceV110(props);
			default:
				throw createResourceTypeNotSupportedError(type);
		}
	}
}
