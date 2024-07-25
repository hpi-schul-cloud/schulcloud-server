import { BaseFactory } from '@shared/testing';
import { ICurrentUser } from '../interface';

class CurrentUser implements ICurrentUser {
	userId: string;

	roles: string[];

	schoolId: string;

	accountId: string;

	systemId: string;

	isExternalUser: boolean;

	constructor(data: ICurrentUser) {
		this.userId = data.userId;
		this.roles = data.roles;
		this.schoolId = data.schoolId;
		this.accountId = data.accountId;
		this.systemId = data.systemId || '';
		this.isExternalUser = data.isExternalUser;
	}
}

export class ICurrentUserFactory extends BaseFactory<CurrentUser, ICurrentUser> {
	public buildAdminICurrentUser(): ICurrentUser {
		return {
			userId: 'mockUserId',
			roles: ['admin'],
			schoolId: 'mockSchoolId',
			accountId: 'mockAccountId',
			systemId: 'mockSystemId',
			isExternalUser: false,
		};
	}

	public buildStudentICurrentUser(): ICurrentUser {
		return {
			userId: 'mockUserId',
			roles: ['student'],
			schoolId: 'mockSchoolId',
			accountId: 'mockAccountId',
			systemId: 'mockSystemId',
			isExternalUser: false,
		};
	}

	public buildTeacherICurrentUser(): ICurrentUser {
		return {
			userId: 'mockUserId',
			roles: ['teacher'],
			schoolId: 'mockSchoolId',
			accountId: 'mockAccountId',
			systemId: 'mockSystemId',
			isExternalUser: false,
		};
	}
}

export const iCurrentUserFactory = ICurrentUserFactory.define(CurrentUser, ({ sequence }) => {
	return {
		userId: `mockUserId ${sequence}`,
		roles: [],
		schoolId: `mockSchoolId ${sequence}`,
		accountId: `mockAccountId ${sequence}`,
		systemId: `mockSystemId ${sequence}`,
		isExternalUser: false,
	};
});
