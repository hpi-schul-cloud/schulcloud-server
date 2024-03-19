export type CommonCartridgeFileParserOptions = {
	maxSearchDepth: number;
	pathSeparator: string;
};

export const DEFAULT_FILE_PARSER_OPTIONS: CommonCartridgeFileParserOptions = {
	maxSearchDepth: 3,
	pathSeparator: '/',
};

export type OrganizationProps = {
	path: string;
	identifier: string;
	identifierRef?: string;
	title: string;
};
