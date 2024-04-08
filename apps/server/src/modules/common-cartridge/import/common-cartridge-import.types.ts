export type CommonCartridgeFileParserOptions = {
	maxSearchDepth: number;
	pathSeparator: string;
};

export const DEFAULT_FILE_PARSER_OPTIONS: CommonCartridgeFileParserOptions = {
	maxSearchDepth: 3,
	pathSeparator: '/',
};

export enum OrganizationType {
	UNKNOWN = 'unknown',
	TITLE = 'title',
	WEB_LINK = 'weblink',
}

export enum ResourceType {
	UNKNOWN = 'unknown',
	TITLE = 'title',
	WEB_CONTENT = 'webcontent',
	WEB_LINK = 'weblink',
}

export type OrganizationProps = {
	path: string;
	pathDepth: number;
	identifier: string;
	identifierRef?: string;
	title: string;
	isResource: boolean;
	resourcePath: string;
	resourceType: string;
};

export type TitleResourceProps = { type: ResourceType.TITLE; title: string };

export type WebContentResourceProps = { type: ResourceType.WEB_CONTENT; title: string; html: string };

export type WebLinkResourceProps = { type: ResourceType.WEB_LINK; title: string; url: string };

export type UnknownResourceProps = { type: ResourceType.UNKNOWN };

export type ResourceProps = TitleResourceProps | WebContentResourceProps | WebLinkResourceProps | UnknownResourceProps;
