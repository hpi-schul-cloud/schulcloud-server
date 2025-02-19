import { EntityId } from '@shared/domain/types';
import { UserDO } from '../domain';

export enum UserDiscoverableQuery {
	TRUE = 'true',
	NOT_FALSE = 'not-false',
}

export type UserQuery = Partial<Pick<UserDO, 'schoolId' | 'outdatedSince'>> & {
	roleId?: EntityId;
	discoverable?: UserDiscoverableQuery;
	isOutdated?: boolean;
	lastLoginSystemChangeSmallerThan?: Date;
	lastLoginSystemChangeBetweenStart?: Date;
	lastLoginSystemChangeBetweenEnd?: Date;
	tspUid?: string;
};
