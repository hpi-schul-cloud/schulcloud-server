import { Action, AuthorizationHelper, AuthorizationInjectionService } from '@modules/authorization';
import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { UserRule } from './user.rule';

describe('UserRule', () => {
	let service: UserRule;
	let authorizationHelper: AuthorizationHelper;
	let user: User;
	let entity: User;
	let role: Role;
	let injectionService: AuthorizationInjectionService;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities([User]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, UserRule, AuthorizationInjectionService],
		}).compile();

		service = await module.get(UserRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	beforeEach(() => {
		role = roleFactory.buildWithId({ permissions: [permissionA, permissionB] });
		user = userFactory.buildWithId({ roles: [role] });
	});

	describe('constructor', () => {
		it('should inject into AuthorizationInjectionService', () => {
			expect(injectionService.getAuthorizationRules()).toContain(service);
		});
	});

	it('should call hasAllPermissions on AuthorizationHelper', () => {
		entity = userFactory.buildWithId();
		user = userFactory.buildWithId({ roles: [role], school: entity });
		const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	it('should return "true" if user in scope', () => {
		user = userFactory.buildWithId({ roles: [role], school: entity });
		entity = user;
		const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
		expect(res).toBe(true);
	});

	it('should return "true" if user in scope but has not permission', () => {
		user = userFactory.buildWithId({ roles: [role], school: entity });
		entity = user;
		const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionC] });
		expect(res).toBe(true);
	});

	it('should return "true" if user has permission but not owner', () => {
		user = userFactory.buildWithId({ roles: [role], school: entity });
		entity = userFactory.buildWithId();
		const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionA] });
		expect(res).toBe(true);
	});

	it('should return "false" if user has not permission', () => {
		entity = userFactory.buildWithId();
		user = userFactory.buildWithId({ roles: [role], school: entity });
		const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionC] });
		expect(res).toBe(false);
	});
});
