import { BaseFactory } from '@shared/testing';
import { ObjectId } from 'bson';
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
	public withRole(role: string): this {
		const params = { roles: [role] };
		return this.params(params);
	}

	public withRoleAdmin() {
		return this.withRole('admin');
	}

	public withRoleStudent() {
		return this.withRole('student');
	}

	public withRoleTeacher() {
		return this.withRole('teacher');
	}
}

export const iCurrentUserFactory = ICurrentUserFactory.define(CurrentUser, () => {
	return {
		userId: new ObjectId().toHexString(),
		roles: [],
		schoolId: new ObjectId().toHexString(),
		accountId: new ObjectId().toHexString(),
		systemId: new ObjectId().toHexString(),
		isExternalUser: false,
	};
});
