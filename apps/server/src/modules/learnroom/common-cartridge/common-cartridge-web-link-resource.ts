import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { ICommonCartridgeFile } from './common-cartridge-file.interface';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from './common-cartridge-enums';
import { toXmlString } from './utils';

export type ICommonCartridgeWebLinkResourceProps = {
	type: CommonCartridgeResourceType.WEB_LINK;
	identifier: string;
	href: string;
};

export class CommonCartridgeWebLinkResourceElement implements ICommonCartridgeElement, ICommonCartridgeFile {
	constructor(private readonly props: ICommonCartridgeWebLinkResourceProps) {}

	canInline(version: CommonCartridgeVersion): boolean {
		switch (version) {
			case CommonCartridgeVersion.V_1_3_0:
				return true;
			default:
				return false;
		}
	}

	content(): string {
		return toXmlString({});
	}

	transform(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
				type: this.props.type,
			},
			file: {
				$: {
					href: this.props.href,
				},
			},
		};
	}
}
