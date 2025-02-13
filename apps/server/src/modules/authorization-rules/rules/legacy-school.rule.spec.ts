import { ObjectId } from '@mikro-orm/mongodb';
import { Action, AuthorizationHelper, AuthorizationInjectionService } from '@modules/authorization';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { legacySchoolDoFactory } from '@testing/factory/domainobject';
import { roleFactory } from '@testing/factory/role.factory';
import { userFactory } from '@testing/factory/user.factory';
import { LegacySchoolRule } from './legacy-school.rule';

describe('LegacySchoolRule', () => {
	let service: LegacySchoolRule;
	let authorizationHelper: AuthorizationHelper;
	let injectionService: AuthorizationInjectionService;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities([User]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, LegacySchoolRule, AuthorizationInjectionService],
		}).compile();

		service = await module.get(LegacySchoolRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	const setupSchoolAndUser = () => {
		const school = legacySchoolDoFactory.build({ id: new ObjectId().toString() });
		const role = roleFactory.build({ permissions: [permissionA, permissionB] });
		const user = userFactory.build({
			roles: [role],
			school: { id: school.id },
		});

		return { school, user };
	};

	describe('constructor', () => {
		it('should inject into AuthorizationInjectionService', () => {
			expect(injectionService.getAuthorizationRules()).toContain(service);
		});
	});

	it('should call hasAllPermissions on AuthorizationHelper', () => {
		const { school, user } = setupSchoolAndUser();
		const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');

		service.hasPermission(user, school, { action: Action.read, requiredPermissions: [] });

		expect(spy).toBeCalledWith(user, []);
	});

	it('should return "true" if user in scope', () => {
		const { school, user } = setupSchoolAndUser();

		const res = service.hasPermission(user, school, { action: Action.read, requiredPermissions: [] });

		expect(res).toBe(true);
	});

	it('should return "false" if user has not permission', () => {
		const { school, user } = setupSchoolAndUser();

		const res = service.hasPermission(user, school, { action: Action.read, requiredPermissions: [permissionC] });

		expect(res).toBe(false);
	});

	it('should return "false" if user has not same school', () => {
		const { user } = setupSchoolAndUser();
		const school = legacySchoolDoFactory.build();

		const res = service.hasPermission(user, school, { action: Action.read, requiredPermissions: [permissionA] });

		expect(res).toBe(false);
	});
});
