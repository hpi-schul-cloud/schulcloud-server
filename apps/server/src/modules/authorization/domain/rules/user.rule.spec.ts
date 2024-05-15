import { Test, TestingModule } from '@nestjs/testing';
import { Role, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { roleFactory, setupEntities, userFactory } from '@shared/testing/factory';
import { Action } from '../type';
import { AuthorizationHelper } from '../service/authorization.helper';
import { UserRule } from './user.rule';

describe('UserRule', () => {
	let service: UserRule;
	let authorizationHelper: AuthorizationHelper;
	let user: User;
	let entity: User;
	let role: Role;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, UserRule],
		}).compile();

		service = await module.get(UserRule);
		authorizationHelper = await module.get(AuthorizationHelper);
	});

	beforeEach(() => {
		role = roleFactory.build({ permissions: [permissionA, permissionB] });
		user = userFactory.build({ roles: [role] });
	});

	it('should call hasAllPermissions on AuthorizationHelper', () => {
		entity = userFactory.build();
		user = userFactory.build({ roles: [role], school: entity });
		const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	it('should return "true" if user in scope', () => {
		user = userFactory.build({ roles: [role], school: entity });
		entity = user;
		const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
		expect(res).toBe(true);
	});

	it('should return "true" if user in scope but has not permission', () => {
		user = userFactory.build({ roles: [role], school: entity });
		entity = user;
		const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionC] });
		expect(res).toBe(true);
	});

	it('should return "true" if user has permission but not owner', () => {
		user = userFactory.build({ roles: [role], school: entity });
		entity = userFactory.build();
		const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionA] });
		expect(res).toBe(true);
	});

	it('should return "false" if user has not permission', () => {
		entity = userFactory.build();
		user = userFactory.build({ roles: [role], school: entity });
		const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionC] });
		expect(res).toBe(false);
	});
});
