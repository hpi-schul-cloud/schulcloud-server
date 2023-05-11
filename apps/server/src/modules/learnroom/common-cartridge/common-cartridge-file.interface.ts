import { CommonCartridgeVersion } from './common-cartridge-enums';

export interface ICommonCartridgeFile {
	canInline(version: CommonCartridgeVersion): boolean;
	content(): string;
}
