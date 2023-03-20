import { Permission, Role, School } from '@shared/domain';
import _ from 'lodash';
import { userPermissions, studentPermissions, teacherPermissions, adminPermissions } from '../user-role-permissions';
import { accountFactory } from './account.factory';
import { roleFactory } from './role.factory';
import { schoolFactory } from './school.factory';
import { userFactory } from './user.factory';

export class UserAndAccountTestFactory {
	// role names from seed and new roles
	static buildUser(role: Role, school: School = schoolFactory.build()) {
		const user = userFactory.withRole(role).build({ school });
		const account = accountFactory.build({ userId: user.id });

		return { account, user, school };
	}

	static buildStudent(additionalPermissions?: Permission[]) {
		const permissions = _.union(userPermissions, studentPermissions, additionalPermissions);
		const teacherRole = roleFactory.build({ permissions });
		const { account, user, school } = UserAndAccountTestFactory.buildUser(teacherRole);

		return { studentAccount: account, studentUser: user, school };
	}

	static buildTeacher(additionalPermissions?: Permission[]) {
		const permissions = _.union(userPermissions, teacherPermissions, additionalPermissions);
		const teacherRole = roleFactory.build({ permissions });
		const { account, user, school } = UserAndAccountTestFactory.buildUser(teacherRole);

		return { teacherAccount: account, teacherUser: user, school };
	}

	static buildAdmin(additionalPermissions?: Permission[]) {
		const permissions = _.union(userPermissions, adminPermissions, additionalPermissions);
		const teacherRole = roleFactory.build({ permissions });
		const { account, user, school } = UserAndAccountTestFactory.buildUser(teacherRole);

		return { adminAccount: account, adminUser: user, school };
	}
}
