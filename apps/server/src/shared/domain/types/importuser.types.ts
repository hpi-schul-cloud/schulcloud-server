export enum MatchCreatorScope {
	AUTO = 'auto',
	MANUAL = 'admin',
	NONE = 'none',
}

export interface IImportUserScope {
	firstName?: string;
	lastName?: string;
	matches?: MatchCreatorScope[];
	flagged?: boolean;
}
