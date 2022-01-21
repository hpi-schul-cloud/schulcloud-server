import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { PermissionService } from '.';
import { Role } from '../entity/role.entity';

describe('resolvePermissions', () => {
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

	it('should return permissions of a user with one role', () => {
		const role = roleFactory.build({ permissions: ['a'] });
		const user = userFactory.build({ roles: [role] });

		const permissions = service.resolvePermissions(user);

		expect(permissions).toEqual(['a']);
	});

	it('should return permissions of a user with many roles', () => {
		const roleA = roleFactory.build({ permissions: ['a'] });
		const roleB = roleFactory.build({ permissions: ['b'] });
		const user = userFactory.build({ roles: [roleA, roleB] });

		const permissions = service.resolvePermissions(user);

		expect(permissions.sort()).toEqual(['a', 'b'].sort());
	});

	it('should return unique permissions', () => {
		const roleA = roleFactory.build({ permissions: ['a', 'b'] });
		const roleB = roleFactory.build({ permissions: ['b', 'c'] });
		const user = userFactory.build({ roles: [roleA, roleB] });

		const permissions = service.resolvePermissions(user);

		expect(permissions.sort()).toEqual(['a', 'b', 'c'].sort());
	});

	it('should return the permissions of the 1st level sub role', () => {
		const roleB = roleFactory.build({ permissions: ['b'] });
		const roleA = roleFactory.build({ permissions: ['a'], roles: [roleB] });
		const user = userFactory.build({ roles: [roleA] });

		const permissions = service.resolvePermissions(user);

		expect(permissions.sort()).toEqual(['a', 'b'].sort());
	});

	it('should return the permissions of nested sub roles', () => {
		const roleC = roleFactory.build({ permissions: ['c'] });
		const roleB = roleFactory.build({ permissions: ['b'], roles: [roleC] });
		const roleA = roleFactory.build({ permissions: ['a'], roles: [roleB] });
		const user = userFactory.build({ roles: [roleA] });

		const permissions = service.resolvePermissions(user);

		expect(permissions.sort()).toEqual(['a', 'b', 'c'].sort());
	});

	it('should return unique permissions of nested sub roles', () => {
		const roleC = roleFactory.build({ permissions: ['c', 'a'] });
		const roleB = roleFactory.build({ permissions: ['b'], roles: [roleC] });
		const roleA = roleFactory.build({ permissions: ['a'], roles: [roleB] });
		const user = userFactory.build({ roles: [roleA] });

		const permissions = service.resolvePermissions(user);

		expect(permissions.sort()).toEqual(['a', 'b', 'c'].sort());
	});

	it('should throw an error if the roles are not populated', () => {
		const user = userFactory.build();
		user.roles.set([orm.em.getReference(Role, new ObjectId().toHexString())]);

		expect(() => service.resolvePermissions(user)).toThrowError();
	});

	it('should throw an error if the sub-roles are not populated', () => {
		const role = roleFactory.build();
		role.roles.set([orm.em.getReference(Role, new ObjectId().toHexString())]);
		const user = userFactory.build({ roles: [role] });

		expect(() => service.resolvePermissions(user)).toThrowError();
	});
});
