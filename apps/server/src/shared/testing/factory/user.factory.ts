/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { Role, User, UserProperties } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import { DeepPartial } from 'fishery';
import _ from 'lodash';
import { adminPermissions, studentPermissions, teacherPermissions, userPermissions } from '../user-role-permissions';
import { BaseFactory } from './base.factory';
import { roleFactory } from './role.factory';
import { schoolEntityFactory } from './school-entity.factory';

class UserFactory extends BaseFactory<User, UserProperties> {
	withRoleByName(name: RoleName): this {
		const params: DeepPartial<UserProperties> = { roles: [roleFactory.buildWithId({ name })] };

		return this.params(params);
	}

	withRole(role: Role): this {
		const params: DeepPartial<UserProperties> = { roles: [role] };

		return this.params(params);
	}

	asStudent(additionalPermissions: Permission[] = []): this {
		const permissions = _.union(userPermissions, studentPermissions, additionalPermissions);
		const role = roleFactory.buildWithId({ permissions, name: RoleName.STUDENT });

		const params: DeepPartial<UserProperties> = { roles: [role] };

		return this.params(params);
	}

	asTeacher(additionalPermissions: Permission[] = []): this {
		const permissions = _.union(userPermissions, teacherPermissions, additionalPermissions);
		const role = roleFactory.buildWithId({ permissions, name: RoleName.TEACHER });

		const params: DeepPartial<UserProperties> = { roles: [role] };

		return this.params(params);
	}

	asAdmin(additionalPermissions: Permission[] = []): this {
		const permissions = _.union(userPermissions, adminPermissions, additionalPermissions);
		const role = roleFactory.buildWithId({ permissions, name: RoleName.ADMINISTRATOR });

		const params: DeepPartial<UserProperties> = { roles: [role] };

		return this.params(params);
	}
}

export const userFactory = UserFactory.define(User, ({ sequence }) => {
	return {
		firstName: 'John',
		lastName: `Doe ${sequence}`,
		email: `user-${sequence}@example.com`,
		roles: [],
		school: schoolEntityFactory.build(),
		consent: {
			userConsent: {
				form: 'digital',
				privacyConsent: true,
				termsOfUseConsent: true,
				dateOfPrivacyConsent: new Date('2017-01-01T00:06:37.148Z'),
				dateOfTermsOfUseConsent: new Date('2017-01-01T00:06:37.148Z'),
			},
			parentConsents: [
				{
					_id: new ObjectId('5ece7de4a194604c6e31f434'),
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: new Date('2017-01-01T00:06:37.148Z'),
					dateOfTermsOfUseConsent: new Date('2017-01-01T00:06:37.148Z'),
				},
			],
		},
	};
});
