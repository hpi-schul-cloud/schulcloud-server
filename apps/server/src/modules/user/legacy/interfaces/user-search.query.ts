import { ObjectId } from 'bson';
import { UserSortQuery } from './user-sort.query';

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
	searchFilterGate?: number;
	createdAt?: Date;
	outdatedSince?: Date;
	lastLoginSystemChange?: Date;
}
