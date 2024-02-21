import { CommonCartridgeElement } from './common-cartridge-element.interface';
import {
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from './common-cartridge-enums';
import { CommonCartridgeFile } from './common-cartridge-file.interface';

export type ICommonCartridgeWebContentResourceProps = {
	type: CommonCartridgeResourceType.WEB_CONTENT;
	version: CommonCartridgeVersion;
	identifier: string;
	href: string;
	title: string;
	html: string;
	intendedUse?: CommonCartridgeIntendedUseType;
};

export class CommonCartridgeWebContentResource implements CommonCartridgeElement, CommonCartridgeFile {
	constructor(private readonly props: ICommonCartridgeWebContentResourceProps) {}

	canInline(): boolean {
		return false;
	}

	content(): string {
		return this.props.html;
	}

	transform(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
				type: this.props.type,
				intendeduse: this.props.intendedUse ?? CommonCartridgeIntendedUseType.UNSPECIFIED,
			},
			file: {
				$: {
					href: this.props.href,
				},
			},
		};
	}
}
