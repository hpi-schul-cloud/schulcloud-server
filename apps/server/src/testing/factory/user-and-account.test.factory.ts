import { ObjectId } from '@mikro-orm/mongodb';
import type { AccountEntity } from '@modules/account/repo';
import { accountFactory } from '@modules/account/testing/account.factory';
import { RoleName } from '@modules/role';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { SchoolEntity } from '@modules/school/repo';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { User } from '@modules/user/repo';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { userFactory } from '@modules/user/testing';
import type { LanguageType, Permission } from '@shared/domain/interface';
import type { EntityId } from '@shared/domain/types';
import _ from 'lodash';

interface UserParams {
	firstName?: string;
	lastName?: string;
	email?: string;
	school?: SchoolEntity;
	externalId?: string;
	language?: LanguageType;
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

	private static buildAccount(user: User, params: UserAndAccountParams = {}): AccountEntity {
		const accountParams = _.pick(params, 'username', 'systemId');
		const account = accountFactory.withUser(user).buildWithId(accountParams);
		return account;
	}

	public static buildStudent(
		params: UserAndAccountParams = {},
		additionalPermissions: Permission[] = []
	): {
		studentAccount: AccountEntity;
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
	): { teacherAccount: AccountEntity; teacherUser: User } {
		const user = userFactory
			.asTeacher(additionalPermissions)
			.buildWithId(UserAndAccountTestFactory.getUserParams(params));
		const account = UserAndAccountTestFactory.buildAccount(user, params);

		return { teacherAccount: account, teacherUser: user };
	}

	public static buildAdmin(
		params: UserAndAccountParams = {},
		additionalPermissions: Permission[] = []
	): { adminAccount: AccountEntity; adminUser: User } {
		const user = userFactory
			.asAdmin(additionalPermissions)
			.buildWithId(UserAndAccountTestFactory.getUserParams(params));
		const account = UserAndAccountTestFactory.buildAccount(user, params);

		return { adminAccount: account, adminUser: user };
	}

	public static buildSuperhero(
		params: UserAndAccountParams = {},
		additionalPermissions: Permission[] = []
	): { superheroAccount: AccountEntity; superheroUser: User } {
		const user = userFactory
			.asSuperhero(additionalPermissions)
			.buildWithId(UserAndAccountTestFactory.getUserParams(params));
		const account = UserAndAccountTestFactory.buildAccount(user, params);

		return { superheroAccount: account, superheroUser: user };
	}

	public static buildByRole(
		roleName: RoleName,
		params: UserAndAccountParams = {},
		additionalPermissions: Permission[] = []
	): { account: AccountEntity; user: User } {
		const user = UserAndAccountTestFactory.buildUser(roleName, params, additionalPermissions);
		const account = UserAndAccountTestFactory.buildAccount(user, params);
		return { account, user };
	}

	private static buildUser(
		roleName: RoleName,
		params: UserAndAccountParams = {},
		additionalPermissions: Permission[] = []
	): User {
		switch (roleName) {
			case RoleName.ADMINISTRATOR:
				return userFactory.asAdmin(additionalPermissions).buildWithId(UserAndAccountTestFactory.getUserParams(params));
			case RoleName.TEACHER:
				return userFactory
					.asTeacher(additionalPermissions)
					.buildWithId(UserAndAccountTestFactory.getUserParams(params));
			case RoleName.STUDENT:
				return userFactory
					.asStudent(additionalPermissions)
					.buildWithId(UserAndAccountTestFactory.getUserParams(params));
			default:
				throw new Error(`Role ${roleName} is not supported`);
		}
	}
}
