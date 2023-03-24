import { Permission, Role, School, EntityId, Account, User, BaseEntity } from '@shared/domain';
import { ObjectId } from 'bson';
import _ from 'lodash';
import { userPermissions, studentPermissions, teacherPermissions, adminPermissions } from '../user-role-permissions';
import { accountFactory } from './account.factory';
import { roleFactory } from './role.factory';
import { schoolFactory } from './school.factory';
import { userFactory } from './user.factory';

interface UserParams {
	firstName?: string;
	lastName?: string;
	email?: string;
	school?: School;
}

interface AccountParams {
	username?: string;
	systemId?: EntityId | ObjectId;
}

interface AccountInternalParams {
	userId: EntityId;
	username?: string;
	systemId?: EntityId | ObjectId;
}

export interface UserAndAccountParams extends UserParams, AccountParams {}

export class UserAndAccountTestFactory {
	private static checkIdExists(entity: BaseEntity): void | Error {
		if (!entity.id) {
			throw new Error('Entity does not have an id.');
		}
	}

	private static getUserParams(params: UserAndAccountParams): UserParams {
		const { firstName, lastName, email } = params;
		const school = params.school || schoolFactory.build();

		const userParams: UserParams = { school };
		if (firstName) userParams.firstName = firstName;
		if (lastName) userParams.lastName = lastName;
		if (email) userParams.email = email;

		return userParams;
	}

	private static getAccountParams(params: UserAndAccountParams, user: User): AccountInternalParams {
		UserAndAccountTestFactory.checkIdExists(user);
		const { username, systemId } = params;

		const accountParams: AccountInternalParams = { userId: user.id };
		if (username) accountParams.username = username;
		if (systemId) accountParams.systemId = systemId;

		return accountParams;
	}

	public static buildUser(
		role: Role,
		params: UserAndAccountParams = {}
	): { account: Account; user: User; school: School } {
		UserAndAccountTestFactory.checkIdExists(role);

		const userParams = UserAndAccountTestFactory.getUserParams(params);
		const user = userFactory.withRole(role).buildWithId(userParams);

		const accountParams = UserAndAccountTestFactory.getAccountParams(params, user);
		const account = accountFactory.build(accountParams);

		return { account, user, school: user.school };
	}

	public static buildStudent(
		params: UserAndAccountParams = {},
		additionalPermissions: Permission[] = []
	): { studentAccount: Account; studentUser: User; school: School } {
		const permissions = _.union(userPermissions, studentPermissions, additionalPermissions);
		const studentRole = roleFactory.buildWithId({ permissions });
		const { account, user, school } = UserAndAccountTestFactory.buildUser(studentRole, params);

		return { studentAccount: account, studentUser: user, school };
	}

	public static buildTeacher(
		params: UserAndAccountParams = {},
		additionalPermissions: Permission[] = []
	): { teacherAccount: Account; teacherUser: User; school: School } {
		const permissions = _.union(userPermissions, teacherPermissions, additionalPermissions);
		const teacherRole = roleFactory.buildWithId({ permissions });
		const { account, user, school } = UserAndAccountTestFactory.buildUser(teacherRole, params);

		return { teacherAccount: account, teacherUser: user, school };
	}

	public static buildAdmin(
		params: UserAndAccountParams = {},
		additionalPermissions: Permission[] = []
	): { adminAccount: Account; adminUser: User; school: School } {
		const permissions = _.union(userPermissions, adminPermissions, additionalPermissions);
		const adminRole = roleFactory.buildWithId({ permissions });
		const { account, user, school } = UserAndAccountTestFactory.buildUser(adminRole, params);

		return { adminAccount: account, adminUser: user, school };
	}
}
