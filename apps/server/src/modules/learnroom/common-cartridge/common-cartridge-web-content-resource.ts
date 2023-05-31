import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { ICommonCartridgeFile } from './common-cartridge-file.interface';
import { CommonCartridgeResourceType } from './common-cartridge-enums';

export type ICommonCartridgeWebContentResourceProps = {
	type: CommonCartridgeResourceType.WEB_CONTENT;
	version: string;
	identifier: string;
	href: string;
	title: string;
	html: string;
};

export class CommonCartridgeWebContentResource implements ICommonCartridgeElement, ICommonCartridgeFile {
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
			},
			file: {
				$: {
					href: this.props.href,
				},
			},
		};
	}
}
