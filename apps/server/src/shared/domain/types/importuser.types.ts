import type { RoleName } from '../entity/import-user.entity';

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
	role?: RoleName;
}
