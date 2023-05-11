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
import { CommonCartridgeVersion } from './common-cartridge-enums';

export type ICommonCartridgeResourceProps =
	| ICommonCartridgeLtiResourceProps
	| ICommonCartridgeWebContentResourceProps
	| ICommonCartridgeWebLinkResourceProps;

export class CommonCartridgeResourceItemElement implements ICommonCartridgeElement, ICommonCartridgeFile {
	private readonly inner: ICommonCartridgeElement & ICommonCartridgeFile;

	constructor(props: ICommonCartridgeResourceProps) {
		if (props.type === 'imsbasiclti_xmlv1p0') {
			this.inner = new CommonCartridgeLtiResource(props);
		} else if (props.type === 'webcontent') {
			this.inner = new CommonCartridgeWebContentResource(props);
		} else if (props.type === 'imswl_xmlv1p1') {
			this.inner = new CommonCartridgeWebLinkResourceElement(props);
		} else {
			throw new Error('Resource type is unknown!');
		}
	}

	canInline(version: CommonCartridgeVersion): boolean {
		return this.inner.canInline(version);
	}

	content(): string {
		return this.inner.content();
	}

	transform(): Record<string, unknown> {
		return this.inner.transform();
	}
}
