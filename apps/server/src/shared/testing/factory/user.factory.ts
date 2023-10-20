/* istanbul ignore file */
import { IUserProperties, Permission, Role, RoleName, User } from '@shared/domain';
import { DeepPartial } from 'fishery';
import _ from 'lodash';
import { adminPermissions, studentPermissions, teacherPermissions, userPermissions } from '../user-role-permissions';
import { BaseFactory } from './base.factory';
import { roleFactory } from './role.factory';
import { schoolFactory } from './school.factory';

class UserFactory extends BaseFactory<User, IUserProperties> {
	withRoleByName(name: RoleName): this {
		const params: DeepPartial<IUserProperties> = { roles: [roleFactory.buildWithId({ name })] };

		return this.params(params);
	}

	withRole(role: Role): this {
		const params: DeepPartial<IUserProperties> = { roles: [role] };

		return this.params(params);
	}

	asStudent(additionalPermissions: Permission[] = []): this {
		const permissions = _.union(userPermissions, studentPermissions, additionalPermissions);
		const role = roleFactory.buildWithId({ permissions });

		const params: DeepPartial<IUserProperties> = { roles: [role] };

		return this.params(params);
	}

	asTeacher(additionalPermissions: Permission[] = []): this {
		const permissions = _.union(userPermissions, teacherPermissions, additionalPermissions);
		const role = roleFactory.buildWithId({ permissions });

		const params: DeepPartial<IUserProperties> = { roles: [role] };

		return this.params(params);
	}

	asAdmin(additionalPermissions: Permission[] = []): this {
		const permissions = _.union(userPermissions, adminPermissions, additionalPermissions);
		const role = roleFactory.buildWithId({ permissions });

		const params: DeepPartial<IUserProperties> = { roles: [role] };

		return this.params(params);
	}
}

export const userFactory = UserFactory.define(User, ({ sequence }) => {
	return {
		firstName: 'John',
		lastName: `Doe ${sequence}`,
		email: `user-${sequence}@example.com`,
		roles: [],
		school: schoolFactory.build(),
	};
});
