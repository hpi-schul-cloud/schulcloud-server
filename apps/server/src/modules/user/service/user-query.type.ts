import { UserDO } from '@shared/domain/domainobject/user.do';

export type UserQuery = Partial<Pick<UserDO, 'schoolId'>> & {
	isOutdated?: boolean;
};
