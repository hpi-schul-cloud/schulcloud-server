import { ObjectId } from '@mikro-orm/mongodb';
import { UserSortQuery } from './user-sort.query';

type DateRangeQuery = Record<string, Date>;
type UserSearchIdQuery = string | string[] | ObjectId | { $in: ObjectId[] };

export interface UserSearchQuery {
	_id?: UserSearchIdQuery;
	schoolId: ObjectId;
	roles: ObjectId;
	schoolYearId?: ObjectId;
	sort?: UserSortQuery;
	select: string[];
	skip?: number;
	limit?: number;
	consentStatus?: Record<string, string[]>;
	classes?: string[];
	searchQuery?: string;
	createdAt?: DateRangeQuery;
	outdatedSince?: DateRangeQuery;
	lastLoginSystemChange?: DateRangeQuery;
}
