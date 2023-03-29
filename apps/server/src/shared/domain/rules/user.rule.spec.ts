import { Test, TestingModule } from '@nestjs/testing';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { Role, User } from '../entity';
import { Permission } from '../interface';
import { Actions } from './actions.enum';
import { UserRule } from './user.rule';

describe('UserRule', () => {
	let service: UserRule;
	let user: User;
	let entity: User;
	let role: Role;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [UserRule],
		}).compile();

		service = await module.get(UserRule);
	});

	beforeEach(() => {
		role = roleFactory.build({ permissions: [permissionA, permissionB] });
		user = userFactory.build({ roles: [role] });
	});

	it('should call baseRule.hasAllPermissions', () => {
		entity = userFactory.build();
		user = userFactory.build({ roles: [role], school: entity });
		const spy = jest.spyOn(service.utils, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	it('should return "true" if user in scope', () => {
		user = userFactory.build({ roles: [role], school: entity });
		entity = user;
		const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
		expect(res).toBe(true);
	});

	it('should return "true" if user in scope but has not permission', () => {
		user = userFactory.build({ roles: [role], school: entity });
		entity = user;
		const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionC] });
		expect(res).toBe(true);
	});

	it('should return "true" if user has permission but not owner', () => {
		user = userFactory.build({ roles: [role], school: entity });
		entity = userFactory.build();
		const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionA] });
		expect(res).toBe(true);
	});

	it('should return "false" if user has not permission', () => {
		entity = userFactory.build();
		user = userFactory.build({ roles: [role], school: entity });
		const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionC] });
		expect(res).toBe(false);
	});
});
