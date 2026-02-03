import { ObjectId } from '@mikro-orm/mongodb';
import { UserSortQuery } from './user-sort.query';

type DateRangeQuery = Record<string, Date>;

export interface UserSearchQuery {
	_id?: any;
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
