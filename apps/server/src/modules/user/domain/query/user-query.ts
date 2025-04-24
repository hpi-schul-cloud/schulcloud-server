import { EntityId } from '@shared/domain/types';
import { UserDo } from '../do';

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
