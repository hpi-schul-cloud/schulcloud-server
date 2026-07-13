import { type EntityId } from '@shared/domain/types';
import { type UserDo } from '../do';

export enum UserDiscoverableQuery {
	TRUE = 'true',
	NOT_FALSE = 'not-false',
}

export type UserQuery = Partial<Pick<UserDo, 'schoolId' | 'outdatedSince'>> & {
	roleId?: EntityId;
	discoverable?: UserDiscoverableQuery;
	isOutdated?: boolean;
	lastLoginSystemChangeSmallerThan?: Date;
	lastLoginSystemChangeBetweenStart?: Date;
	lastLoginSystemChangeBetweenEnd?: Date;
};
