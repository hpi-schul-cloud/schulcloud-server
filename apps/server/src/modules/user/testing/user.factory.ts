/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { RoleName } from '@modules/role';
import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { Permission } from '@shared/domain/interface';
import { BaseFactory } from '@testing/factory/base.factory';
import {
	adminPermissions,
	studentPermissions,
	superheroPermissions,
	teacherPermissions,
	userPermissions,
	defaultSystemUserPermissions,
} from '@testing/user-role-permissions';
import { DeepPartial } from 'fishery';
import _ from 'lodash';
import { ConsentEntity, ParentConsentEntity, User, UserConsentEntity, UserProperties } from '../repo';

const userConsentFactory = BaseFactory.define<UserConsentEntity, UserConsentEntity>(UserConsentEntity, () => {
	return {
		form: 'digital',
		privacyConsent: true,
		termsOfUseConsent: true,
		dateOfPrivacyConsent: new Date('2017-01-01T00:06:37.148Z'),
		dateOfTermsOfUseConsent: new Date('2017-01-01T00:06:37.148Z'),
	};
});

const parentConsentFactory = BaseFactory.define<ParentConsentEntity, ParentConsentEntity>(ParentConsentEntity, () => {
	return {
		_id: new ObjectId(),
		form: 'digital',
		privacyConsent: true,
		termsOfUseConsent: true,
		dateOfPrivacyConsent: new Date('2017-01-01T00:06:37.148Z'),
		dateOfTermsOfUseConsent: new Date('2017-01-01T00:06:37.148Z'),
	};
});

const consentFactory = BaseFactory.define<ConsentEntity, ConsentEntity>(ConsentEntity, () => {
	return {
		userConsent: userConsentFactory.build(),
		parentConsents: parentConsentFactory.buildList(1),
	};
});

class UserFactory extends BaseFactory<User, UserProperties> {
	public withRoleByName(name: RoleName): this {
		const params: DeepPartial<UserProperties> = { roles: [roleFactory.buildWithId({ name })] };

		return this.params(params);
	}

	public withRole(role: Role): this {
		const params: DeepPartial<UserProperties> = { roles: [role] };

		return this.params(params);
	}

	public withPermissionsInRole(permissions: Permission[] = []): this {
		const role = roleFactory.buildWithId({ permissions });
		const params: DeepPartial<UserProperties> = { roles: [role] };

		return this.params(params);
	}

	public asStudent(additionalPermissions: Permission[] = []): this {
		const permissions = _.union(userPermissions, studentPermissions, additionalPermissions);
		const role = roleFactory.buildWithId({ permissions, name: RoleName.STUDENT });

		const params: DeepPartial<UserProperties> = { roles: [role] };

		return this.params(params);
	}

	public asTeacher(additionalPermissions: Permission[] = []): this {
		const permissions = _.union(userPermissions, teacherPermissions, additionalPermissions);
		const role = roleFactory.buildWithId({ permissions, name: RoleName.TEACHER });

		const params: DeepPartial<UserProperties> = { roles: [role] };

		return this.params(params);
	}

	public asAdmin(additionalPermissions: Permission[] = []): this {
		const permissions = _.union(userPermissions, adminPermissions, additionalPermissions);
		const role = roleFactory.buildWithId({ permissions, name: RoleName.ADMINISTRATOR });

		const params: DeepPartial<UserProperties> = { roles: [role] };

		return this.params(params);
	}

	public asSuperhero(additionalPermissions: Permission[] = []): this {
		const permissions = _.union(userPermissions, superheroPermissions, additionalPermissions);
		const role = roleFactory.buildWithId({ permissions, name: RoleName.SUPERHERO });

		const params: DeepPartial<UserProperties> = { roles: [role] };

		return this.params(params);
	}

	public asSystemUser(requiredAdditionalPermissions: Permission[]): this {
		const permissions = _.union(defaultSystemUserPermissions, requiredAdditionalPermissions);

		const role = roleFactory.buildWithId({ permissions, name: RoleName.RANDOMSYSTEMUSER });

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
		school: schoolEntityFactory.buildWithId(),
		consent: consentFactory.build(),
		secondarySchools: [],
	};
});
