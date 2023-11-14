import type { IImportUserRoleName } from '../entity/import-user.entity';

export enum MatchCreatorScope {
	AUTO = 'auto',
	MANUAL = 'admin',
	NONE = 'none',
}

export interface ImportUserScopeInterface {
	firstName?: string;
	lastName?: string;
	loginName?: string;
	matches?: MatchCreatorScope[];
	flagged?: boolean;
	role?: IImportUserRoleName;
	classes?: string;
}

export interface NameMatch {
	/**
	 * Match filter for lastName or firstName
	 */
	name?: string;
}
