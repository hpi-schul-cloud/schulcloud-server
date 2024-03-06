import { Account, SchoolEntity, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from '@mikro-orm/mongodb';
import _ from 'lodash';
import { accountFactory } from './account.factory';
import { userFactory } from './user.factory';

interface UserParams {
	firstName?: string;
	lastName?: string;
	email?: string;
	school?: SchoolEntity;
	externalId?: string;
}

interface AccountParams {
	username?: string;
	systemId?: EntityId | ObjectId;
}

export interface UserAndAccountParams extends UserParams, AccountParams {}

export class UserAndAccountTestFactory {
	private static getUserParams(params: UserAndAccountParams): UserParams {
		const userParams = _.pick(params, 'firstName', 'lastName', 'email', 'school', 'externalId');
		return userParams;
	}

	private static buildAccount(user: User, params: UserAndAccountParams = {}): Account {
		const accountParams = _.pick(params, 'username', 'systemId');
		const account = accountFactory.withUser(user).build(accountParams);
		return account;
	}

	public static buildStudent(
		params: UserAndAccountParams = {},
		additionalPermissions: Permission[] = []
	): {
		studentAccount: Account;
		studentUser: User;
	} {
		const user = userFactory
			.asStudent(additionalPermissions)
			.buildWithId(UserAndAccountTestFactory.getUserParams(params));
		const account = UserAndAccountTestFactory.buildAccount(user, params);

		return { studentAccount: account, studentUser: user };
	}

	public static buildTeacher(
		params: UserAndAccountParams = {},
		additionalPermissions: Permission[] = []
	): { teacherAccount: Account; teacherUser: User } {
		const user = userFactory
			.asTeacher(additionalPermissions)
			.buildWithId(UserAndAccountTestFactory.getUserParams(params));
		const account = UserAndAccountTestFactory.buildAccount(user, params);

		return { teacherAccount: account, teacherUser: user };
	}

	public static buildAdmin(
		params: UserAndAccountParams = {},
		additionalPermissions: Permission[] = []
	): { adminAccount: Account; adminUser: User } {
		const user = userFactory
			.asAdmin(additionalPermissions)
			.buildWithId(UserAndAccountTestFactory.getUserParams(params));
		const account = UserAndAccountTestFactory.buildAccount(user, params);

		return { adminAccount: account, adminUser: user };
	}
}
