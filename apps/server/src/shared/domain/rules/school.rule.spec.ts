import { Test, TestingModule } from '@nestjs/testing';
import { LegacySchoolDo } from '@shared/domain';
import { Role, School, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { roleFactory, schoolDOFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { Action } from '@src/modules/authorization/types';
import { SchoolRule } from './school.rule';

describe('SchoolRule', () => {
	let service: SchoolRule;
	let authorizationHelper: AuthorizationHelper;
	let user: User;
	let entity: School | LegacySchoolDo;
	let role: Role;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, SchoolRule],
		}).compile();

		service = await module.get(SchoolRule);
		authorizationHelper = await module.get(AuthorizationHelper);
	});

	beforeEach(() => {
		role = roleFactory.build({ permissions: [permissionA, permissionB] });
		user = userFactory.build({ roles: [role] });
	});

	it('should call hasAllPermissions on AuthorizationHelper', () => {
		entity = schoolFactory.build();
		user = userFactory.build({ roles: [role], school: entity });
		const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	it('should return "true" if user in scope', () => {
		entity = schoolFactory.build();
		user = userFactory.build({ roles: [role], school: entity });
		const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
		expect(res).toBe(true);
	});

	it('should return "false" if user has not permission', () => {
		entity = schoolFactory.build();
		user = userFactory.build({ roles: [role], school: entity });
		const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionC] });
		expect(res).toBe(false);
	});

	it('should return "false" if user has not some school', () => {
		entity = schoolDOFactory.build({ name: 'testschool', id: 'invalidId' });
		user = userFactory.build({ roles: [role] });
		const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionA] });
		expect(res).toBe(false);
	});
});
