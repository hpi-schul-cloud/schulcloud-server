import { ObjectID } from 'bson';
import { UserSortQuery } from './user-sort.query';

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
	createdAt?: Date;
	outdatedSince?: Date;
	lastLoginSystemChange?: Date;
}
