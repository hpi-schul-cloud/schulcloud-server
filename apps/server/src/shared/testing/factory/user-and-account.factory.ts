import { Permission, Role, School, EntityId, Account, User } from '@shared/domain';
import { ObjectId } from 'bson';
import _ from 'lodash';
import { userPermissions, studentPermissions, teacherPermissions, adminPermissions } from '../user-role-permissions';
import { accountFactory } from './account.factory';
import { roleFactory } from './role.factory';
import { schoolFactory } from './school.factory';
import { userFactory } from './user.factory';

interface UserAndAccountParams {
	username?: string;
	systemId?: EntityId | ObjectId;
	firstName?: string;
	lastName?: string;
	email?: string;
	school?: School;
}

export class UserAndAccountTestFactory {
	public static buildUser(
		role: Role,
		params: UserAndAccountParams = {}
	): { account: Account; user: User; school: School } {
		const { username, systemId, firstName, lastName, email } = params;
		const school = params.school || schoolFactory.build();

		const user = userFactory.withRole(role).buildWithId({ school, firstName, lastName, email });
		const account = accountFactory.withSystemId(params.systemId).build({ userId: user.id, username, systemId });

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
