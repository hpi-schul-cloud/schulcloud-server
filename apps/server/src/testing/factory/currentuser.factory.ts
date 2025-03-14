// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { ICurrentUser } from '@infra/auth-guard';
import { ObjectId } from 'bson';
import { BaseFactory } from './base.factory';

class CurrentUser implements ICurrentUser {
	userId: string;

	roles: string[];

	schoolId: string;

	accountId: string;

	systemId: string;

	isExternalUser: boolean;

	support: boolean;

	supportUserId?: string;

	constructor(data: ICurrentUser) {
		this.userId = data.userId;
		this.roles = data.roles;
		this.schoolId = data.schoolId;
		this.accountId = data.accountId;
		this.systemId = data.systemId || '';
		this.isExternalUser = data.isExternalUser;
		this.support = false;
		this.supportUserId = data.supportUserId;
	}
}

export class CurrentUserFactory extends BaseFactory<CurrentUser, ICurrentUser> {
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

export const currentUserFactory = CurrentUserFactory.define(CurrentUser, () => {
	return {
		userId: new ObjectId().toHexString(),
		roles: [],
		schoolId: new ObjectId().toHexString(),
		accountId: new ObjectId().toHexString(),
		systemId: new ObjectId().toHexString(),
		isExternalUser: false,
		support: false,
		supportUserId: undefined,
	};
});
