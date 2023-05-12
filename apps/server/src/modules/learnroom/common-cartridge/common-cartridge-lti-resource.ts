import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { ICommonCartridgeFile } from './common-cartridge-file.interface';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from './common-cartridge-enums';

export type ICommonCartridgeLtiResourceProps = {
	type: CommonCartridgeResourceType.LTI;
	version: CommonCartridgeVersion;
	identifier: string;
	href: string;
	title: string;
};

export class CommonCartridgeLtiResource implements ICommonCartridgeElement, ICommonCartridgeFile {
	constructor(private readonly props: ICommonCartridgeLtiResourceProps) {}

	canInline(): boolean {
		return false;
	}

	content(): string {
		throw new Error('Method not implemented.');
	}

	transform(): Record<string, unknown> {
		throw new Error('Method not implemented.');
	}
}
