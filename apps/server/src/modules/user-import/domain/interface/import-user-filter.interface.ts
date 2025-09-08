import type { ImportUserRoleName } from '../../entity';
import { ImportUserMatchCreatorScope } from './import-user-match-creator-scope.enum';

export interface ImportUserFilter {
	firstName?: string;
	lastName?: string;
	loginName?: string;
	matches?: ImportUserMatchCreatorScope[];
	flagged?: boolean;
	role?: ImportUserRoleName;
	classes?: string;
}
