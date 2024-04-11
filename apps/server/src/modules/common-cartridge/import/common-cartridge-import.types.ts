import { CommonCartridgeResourceTypeV1P1 } from './common-cartridge-import.enums';

export type CommonCartridgeFileParserOptions = {
	maxSearchDepth: number;
	pathSeparator: string;
};

export const DEFAULT_FILE_PARSER_OPTIONS: CommonCartridgeFileParserOptions = {
	maxSearchDepth: 3,
	pathSeparator: '/',
};

export type CommonCartridgeOrganizationProps = {
	path: string;
	pathDepth: number;
	identifier: string;
	identifierRef?: string;
	title: string;
	isResource: boolean;
	isInlined: boolean;
	resourcePath: string;
	resourceType: string;
};

export type CommonCartridgeWebContentResourceProps = {
	type: CommonCartridgeResourceTypeV1P1.WEB_CONTENT;
	title: string;
	html: string;
};

export type CommonCartridgeWebLinkResourceProps = {
	type: CommonCartridgeResourceTypeV1P1.WEB_LINK;
	title: string;
	url: string;
};

export type CommonCartridgeUnknownResourceProps = { type: CommonCartridgeResourceTypeV1P1.UNKNOWN };

export type CommonCartridgeResourceProps =
	| CommonCartridgeWebContentResourceProps
	| CommonCartridgeWebLinkResourceProps
	| CommonCartridgeUnknownResourceProps;
