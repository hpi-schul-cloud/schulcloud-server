import { UserDO } from '@shared/domain/domainobject/user.do';

export type UserQuery = Partial<Pick<UserDO, 'schoolId' | 'outdatedSince'>> & {
	isOutdated?: boolean;
	lastLoginSystemChangeSmallerThan?: Date;
	lastLoginSystemChangeBetweenStart?: Date;
	lastLoginSystemChangeBetweenEnd?: Date;
};
