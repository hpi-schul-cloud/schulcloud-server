import { CommonCartridgeResourceType } from '../common-cartridge.enums';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import { CommonCartridgeLtiResource, CommonCartridgeLtiResourceProps } from './common-cartridge-lti-resource';
import {
	CommonCartridgeWebContentResource,
	CommonCartridgeWebContentResourceProps,
} from './common-cartridge-web-content-resource';
import {
	CommonCartridgeWebLinkResource,
	CommonCartridgeWebLinkResourceProps,
} from './common-cartridge-web-link-resource';

type CommonCartridgeResourceProps =
	| CommonCartridgeLtiResourceProps
	| CommonCartridgeWebContentResourceProps
	| CommonCartridgeWebLinkResourceProps;

export class CommonCartridgeResourceFactory {
	static createResource(props: CommonCartridgeResourceProps): CommonCartridgeResource {
		switch (props.type) {
			case CommonCartridgeResourceType.LTI:
				return new CommonCartridgeLtiResource(props);
			case CommonCartridgeResourceType.WEB_CONTENT:
				return new CommonCartridgeWebContentResource(props);
			case CommonCartridgeResourceType.WEB_LINK:
				return new CommonCartridgeWebLinkResource(props);
			default:
				throw new Error(`Unknown Common Cartridge resource type`);
		}
	}
}
