import { UserDO } from '@shared/domain/domainobject/user.do';
import { EntityId } from '@shared/domain/types';

export type UserDiscoverableQuery = 'true' | 'not-false';

export type UserQuery = Partial<Pick<UserDO, 'schoolId' | 'outdatedSince'>> & {
	roleId?: EntityId;
	discoverable?: UserDiscoverableQuery;
	isOutdated?: boolean;
	lastLoginSystemChangeSmallerThan?: Date;
	lastLoginSystemChangeBetweenStart?: Date;
	lastLoginSystemChangeBetweenEnd?: Date;
};
