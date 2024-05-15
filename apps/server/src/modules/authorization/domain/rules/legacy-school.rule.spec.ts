import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { roleFactory, legacySchoolDoFactory, setupEntities, userFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { Action } from '../type';
import { AuthorizationHelper } from '../service/authorization.helper';
import { LegacySchoolRule } from './legacy-school.rule';

describe('LegacySchoolRule', () => {
	let service: LegacySchoolRule;
	let authorizationHelper: AuthorizationHelper;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, LegacySchoolRule],
		}).compile();

		service = await module.get(LegacySchoolRule);
		authorizationHelper = await module.get(AuthorizationHelper);
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
