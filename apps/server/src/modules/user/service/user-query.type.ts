import { UserDO } from '@shared/domain/domainobject/user.do';
import { EntityId } from '@shared/domain/types';

export type UserQuery = Partial<Pick<UserDO, 'schoolId' | 'outdatedSince'>> & {
	roleId?: EntityId;
	isOutdated?: boolean;
	lastLoginSystemChangeSmallerThan?: Date;
	lastLoginSystemChangeBetweenStart?: Date;
	lastLoginSystemChangeBetweenEnd?: Date;
};
