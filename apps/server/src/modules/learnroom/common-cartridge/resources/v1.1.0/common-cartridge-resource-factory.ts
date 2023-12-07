import { CommonCartridgeResourceType } from '../../common-cartridge.enums';
import { CommonCartridgeResourceFactory } from '../../interfaces/common-cartridge-resource-factory.interface';
import { CommonCartridgeResource } from '../../interfaces/common-cartridge-resource.interface';
import { createResourceTypeNotSupportedError } from '../../utils';
import { CommonCartridgeLtiResource, CommonCartridgeLtiResourceProps } from './common-cartridge-lti-resource';
import {
	CommonCartridgeWebContentResource,
	CommonCartridgeWebContentResourceProps,
} from './common-cartridge-web-content-resource';
import {
	CommonCartridgeWebLinkResource,
	CommonCartridgeWebLinkResourceProps,
} from './common-cartridge-web-link-resource';

export type CommonCartridgeResourcePropsV110 =
	| CommonCartridgeLtiResourceProps
	| CommonCartridgeWebContentResourceProps
	| CommonCartridgeWebLinkResourceProps;

export class CommonCartridgeResourceFactoryV110 extends CommonCartridgeResourceFactory {
	public static readonly instance = new CommonCartridgeResourceFactoryV110();

	public static getInstance(): CommonCartridgeResourceFactory {
		return this.instance;
	}

	public override createResource(props: CommonCartridgeResourcePropsV110): CommonCartridgeResource {
		const { type } = props;

		switch (type) {
			case CommonCartridgeResourceType.LTI:
				return new CommonCartridgeLtiResource(props);
			case CommonCartridgeResourceType.WEB_CONTENT:
				return new CommonCartridgeWebContentResource(props);
			case CommonCartridgeResourceType.WEB_LINK:
				return new CommonCartridgeWebLinkResource(props);
			default:
				throw createResourceTypeNotSupportedError(type);
		}
	}
}
