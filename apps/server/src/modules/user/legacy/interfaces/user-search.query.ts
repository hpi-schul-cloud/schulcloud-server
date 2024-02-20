import { UserSortQuery } from '@modules/user/legacy/interfaces/user-sort.query';
import { ObjectID } from 'bson';

export interface UserSearchQuery {
	_id?: any;
	schoolId: ObjectID;
	roles: ObjectID;
	schoolYearId: ObjectID | undefined;
	sort: UserSortQuery | undefined;
	select: string[];
	skip: number | undefined;
	limit: number | undefined;
	consentStatus?: Record<string, string[]>;
	classes?: string[];
	searchQuery?: string;
	searchFilterGate?: number;
	createdAt?: Date | undefined;
	outdatedSince?: Date | undefined;
	lastLoginSystemChange?: Date | undefined;
}
