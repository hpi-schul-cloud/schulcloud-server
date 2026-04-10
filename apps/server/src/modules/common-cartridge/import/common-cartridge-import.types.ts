import { InputFormat } from '@shared/domain/types';
import { CommonCartridgeXmlResourceType } from './common-cartridge-import.enums';

export type CommonCartridgeFileParserOptions = {
	maxSearchDepth: number;
	pathSeparator: string;
	inputFormat: InputFormat;
};

export const DEFAULT_FILE_PARSER_OPTIONS: CommonCartridgeFileParserOptions = {
	maxSearchDepth: 5,
	pathSeparator: '/',
	inputFormat: InputFormat.RICH_TEXT_CK5,
};

export type CommonCartridgeOrganizationProps = {
	path: string;
	pathDepth: number;
	identifier: string;
	identifierRef?: string;
	title: string;
	isResource: boolean;
	isInlined: boolean;
	resourcePaths: string[];
	resourceType: string;
};

export type CommonCartridgeWebContentResourceProps = {
	type: CommonCartridgeXmlResourceType.WEB_CONTENT;
	html: string;
};

export type CommonCartridgeWebLinkResourceProps = {
	type: CommonCartridgeXmlResourceType.WEB_LINK_CC11 | CommonCartridgeXmlResourceType.WEB_LINK_CC13;
	title: string;
	url: string;
};

export type CommonCartridgeFileResourceProps = {
	type: CommonCartridgeXmlResourceType.FILE;
	href: string;
	fileName: string;
	file: File;
	description: string;
};

export type CommonCartridgeFileFolderResourceProps = {
	type: CommonCartridgeXmlResourceType.FILE_FOLDER;
	title: string;
	files: File[];
};

export type CommonCartridgeUnknownResourceProps = { type: CommonCartridgeXmlResourceType.UNKNOWN };

export type CommonCartridgeResourceProps =
	| CommonCartridgeWebContentResourceProps
	| CommonCartridgeWebLinkResourceProps
	| CommonCartridgeUnknownResourceProps
	| CommonCartridgeFileResourceProps
	| CommonCartridgeFileFolderResourceProps;
