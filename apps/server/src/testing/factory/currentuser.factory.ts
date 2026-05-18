// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { ICurrentUser } from '@infra/auth-guard';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from './base.factory';

class CurrentUser implements ICurrentUser {
	public userId: string;

	public roles: string[];

	public schoolId: string;

	public accountId: string;

	public systemId: string;

	public isExternalUser: boolean;

	public systemUser: boolean;

	public support: boolean;

	public supportUserId?: string;

	constructor(data: ICurrentUser) {
		this.userId = data.userId;
		this.roles = data.roles;
		this.schoolId = data.schoolId;
		this.accountId = data.accountId;
		this.systemId = data.systemId || '';
		this.isExternalUser = data.isExternalUser;
		this.systemUser = data.systemUser || false;
		this.support = data.support || false;
		this.supportUserId = data.supportUserId;
	}
}

class CurrentUserFactory extends BaseFactory<CurrentUser, ICurrentUser> {
	public withRole(role: string): this {
		const params = { roles: [role] };
		return this.params(params);
	}

	public withRoleAdmin(): this {
		return this.withRole('admin');
	}

	public withRoleStudent(): this {
		return this.withRole('student');
	}

	public withRoleTeacher(): this {
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
		systemUser: false,
		supportUserId: undefined,
	};
});
