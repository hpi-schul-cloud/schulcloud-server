import { Builder } from 'xml2js';
import { CommonCartridgeLtiResource, ICommonCartridgeLtiResourceProps } from './common-cartridge-lti-resource';
import {
	CommonCartridgeWebContentResource,
	ICommonCartridgeWebContentResourceProps,
} from './common-cartridge-web-content-resource';
import {
	CommonCartridgeWebLinkResourceElement,
	ICommonCartridgeWebLinkResourceProps,
} from './common-cartridge-web-link-resource';
import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { ICommonCartridgeFile } from './common-cartridge-file.interface';
import { CommonCartridgeResourceType } from './common-cartridge-enums';

export type ICommonCartridgeResourceProps =
	| ICommonCartridgeLtiResourceProps
	| ICommonCartridgeWebContentResourceProps
	| ICommonCartridgeWebLinkResourceProps;

export class CommonCartridgeResourceItemElement implements ICommonCartridgeElement, ICommonCartridgeFile {
	private readonly inner: ICommonCartridgeElement & ICommonCartridgeFile;

	constructor(props: ICommonCartridgeResourceProps, xmlBuilder: Builder) {
		if (props.type === CommonCartridgeResourceType.LTI) {
			this.inner = new CommonCartridgeLtiResource(props, xmlBuilder);
		} else if (props.type === CommonCartridgeResourceType.WEB_CONTENT) {
			this.inner = new CommonCartridgeWebContentResource(props);
		} else if (
			props.type === CommonCartridgeResourceType.WEB_LINK_V1 ||
			props.type === CommonCartridgeResourceType.WEB_LINK_V3
		) {
			this.inner = new CommonCartridgeWebLinkResourceElement(props, xmlBuilder);
		} else {
			throw new Error('Resource type is unknown!');
		}
	}

	canInline(): boolean {
		return this.inner.canInline();
	}

	content(): string {
		return this.inner.content();
	}

	transform(): Record<string, unknown> {
		return this.inner.transform();
	}
}
