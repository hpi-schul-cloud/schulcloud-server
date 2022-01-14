import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { PermissionService } from '.';

describe('resolveRolesAndPermissions', () => {
	let orm: MikroORM;
	let service: PermissionService;

	beforeAll(async () => {
		orm = await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [PermissionService],
		}).compile();

		service = await module.get(PermissionService);
	});

	afterAll(async () => {
		await orm.close();
	});

	it('should return the roles of a user', () => {
		const role = roleFactory.build();
		const user = userFactory.build({ roles: [role] });

		const [roles] = service.resolveRolesAndPermissions(user);

		expect(roles).toEqual([role]);
	});

	it('should return the roles of a user recursively', () => {
		const roleC = roleFactory.build();
		const roleB = roleFactory.build({ roles: [roleC] });
		const roleA = roleFactory.build({ roles: [roleB] });
		const user = userFactory.build({ roles: [roleA] });

		const [roles] = service.resolveRolesAndPermissions(user);

		expect(roles.sort()).toEqual([roleA, roleB, roleC].sort());
	});

	it('should return the unique roles of a user', () => {
		const roleC = roleFactory.build();
		const roleB = roleFactory.build({ roles: [roleC] });
		const roleA = roleFactory.build({ roles: [roleB, roleC] });
		const user = userFactory.build({ roles: [roleA, roleC] });

		const [roles] = service.resolveRolesAndPermissions(user);

		expect(roles.sort((r1, r2) => r1.name.localeCompare(r2.name))).toEqual(
			[roleA, roleB, roleC].sort((r1, r2) => r1.name.localeCompare(r2.name))
		);
	});

	it('should return permissions of a user with one role', () => {
		const role = roleFactory.build({ permissions: ['a'] });
		const user = userFactory.build({ roles: [role] });

		const [, permissions] = service.resolveRolesAndPermissions(user);

		expect(permissions).toEqual(['a']);
	});

	it('should return permissions of a user with many roles', async () => {
		const roleA = roleFactory.build({ permissions: ['a'] });
		const roleB = roleFactory.build({ permissions: ['b'] });
		const user = userFactory.build({ roles: [roleA, roleB] });

		const [, permissions] = service.resolveRolesAndPermissions(user);

		expect(permissions.sort()).toEqual(['a', 'b'].sort());
	});

	it('should return unique permissions', async () => {
		const roleA = roleFactory.build({ permissions: ['a', 'b'] });
		const roleB = roleFactory.build({ permissions: ['b', 'c'] });
		const user = userFactory.build({ roles: [roleA, roleB] });

		const [, permissions] = service.resolveRolesAndPermissions(user);

		expect(permissions.sort()).toEqual(['a', 'b', 'c'].sort());
	});

	it('should return the permissions of the 1st level sub role', async () => {
		const roleB = roleFactory.build({ permissions: ['b'] });
		const roleA = roleFactory.build({ permissions: ['a'], roles: [roleB] });
		const user = userFactory.build({ roles: [roleA] });

		const [, permissions] = service.resolveRolesAndPermissions(user);

		expect(permissions.sort()).toEqual(['a', 'b'].sort());
	});

	it('should return the permissions of nested sub roles', async () => {
		const roleC = roleFactory.build({ permissions: ['c'] });
		const roleB = roleFactory.build({ permissions: ['b'], roles: [roleC] });
		const roleA = roleFactory.build({ permissions: ['a'], roles: [roleB] });
		const user = userFactory.build({ roles: [roleA] });

		const [, permissions] = service.resolveRolesAndPermissions(user);

		expect(permissions.sort()).toEqual(['a', 'b', 'c'].sort());
	});

	it('should return unique permissions of nested sub roles', async () => {
		const roleC = roleFactory.build({ permissions: ['c', 'a'] });
		const roleB = roleFactory.build({ permissions: ['b'], roles: [roleC] });
		const roleA = roleFactory.build({ permissions: ['a'], roles: [roleB] });
		const user = userFactory.build({ roles: [roleA] });

		const [, permissions] = service.resolveRolesAndPermissions(user);

		expect(permissions.sort()).toEqual(['a', 'b', 'c'].sort());
	});
});
