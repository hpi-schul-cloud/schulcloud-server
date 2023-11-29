import { CommonCartridgeResourceType } from '../common-cartridge.enums';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import { OmitVersionAndFolder } from '../utils';
import { CommonCartridgeLtiResource, CommonCartridgeLtiResourceProps } from './common-cartridge-lti-resource';
import {
	CommonCartridgeWebContentResource,
	CommonCartridgeWebContentResourceProps,
} from './common-cartridge-web-content-resource';
import {
	CommonCartridgeWebLinkResource,
	CommonCartridgeWebLinkResourceProps,
} from './common-cartridge-web-link-resource';

export type CommonCartridgeResourceProps =
	| OmitVersionAndFolder<CommonCartridgeLtiResourceProps>
	| OmitVersionAndFolder<CommonCartridgeWebContentResourceProps>
	| OmitVersionAndFolder<CommonCartridgeWebLinkResourceProps>;

type CommonCartridgeResourcePropsInternal =
	| CommonCartridgeLtiResourceProps
	| CommonCartridgeWebContentResourceProps
	| CommonCartridgeWebLinkResourceProps;

export class CommonCartridgeResourceFactory {
	static create(props: CommonCartridgeResourcePropsInternal): CommonCartridgeResource {
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
