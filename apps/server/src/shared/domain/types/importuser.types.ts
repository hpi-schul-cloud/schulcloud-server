import type { IImportUserRoleName } from '../entity/import-user.entity';

export enum MatchCreatorScope {
	AUTO = 'auto',
	MANUAL = 'admin',
	NONE = 'none',
}

export interface IImportUserScope {
	firstName?: string;
	lastName?: string;
	loginName?: string;
	matches?: MatchCreatorScope[];
	flagged?: boolean;
	role?: IImportUserRoleName;
	classes?: string;
}

export interface INameMatch {
	/**
	 * Match filter for lastName or firstName
	 */
	name?: string;
}
