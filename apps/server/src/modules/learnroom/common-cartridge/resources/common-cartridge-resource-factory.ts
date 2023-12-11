import { CommonCartridgeResourceType } from '../common-cartridge.enums';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import { OmitVersionAndFolder } from '../utils';
import {
	CommonCartridgeWebContentResource,
	CommonCartridgeWebContentResourceProps,
} from './common-cartridge-web-content-resource';
import {
	CommonCartridgeWebLinkResource,
	CommonCartridgeWebLinkResourceProps,
} from './common-cartridge-web-link-resource';

export type CommonCartridgeResourceProps =
	| OmitVersionAndFolder<CommonCartridgeWebContentResourceProps>
	| OmitVersionAndFolder<CommonCartridgeWebLinkResourceProps>;

type CommonCartridgeResourcePropsInternal =
	| CommonCartridgeWebContentResourceProps
	| CommonCartridgeWebLinkResourceProps;

export class CommonCartridgeResourceFactory {
	static create(props: CommonCartridgeResourcePropsInternal): CommonCartridgeResource {
		switch (props.type) {
			case CommonCartridgeResourceType.WEB_CONTENT:
				return new CommonCartridgeWebContentResource(props);
			case CommonCartridgeResourceType.WEB_LINK:
				return new CommonCartridgeWebLinkResource(props);
			default:
				// use InternalServerErrorException
				throw new Error(`Unknown Common Cartridge resource type`);
		}
	}
}
