import { MikroORM } from '@mikro-orm/core';
import { roleFactory, setupEntities } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { Permission, RoleName } from '../interface';
import { Role } from './role.entity';
// import { Permission,  } from '..';

describe('Role Entity', () => {
	let orm: MikroORM;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	describe('constructor', () => {
		it('should throw an error when called without required properties', () => {
			// @ts-expect-error: Test case
			const test = () => new Role();

			expect(test).toThrow();
		});

		it('should create a user when passing required properties', () => {
			const role = new Role({ name: RoleName.DEMO });

			expect(role).toBeInstanceOf(Role);
		});
	});

	describe('resolvePermissions', () => {
		it('should throw error when roles are not populated', () => {
			const role = roleFactory.build();
			role.roles.set([orm.em.getReference(Role, new ObjectId().toHexString())]);

			expect(() => role.resolvePermissions()).toThrowError();
		});

		it('should throw error when sub roles are not populated', () => {
			const roleA = roleFactory.build();
			roleA.roles.set([orm.em.getReference(Role, new ObjectId().toHexString())]);
			const role = roleFactory.build({ roles: [roleA] });

			expect(() => role.resolvePermissions()).toThrowError();
		});

		it('should return empty array if the role has no permissions', () => {
			const role = roleFactory.build({ permissions: [] });

			const result = role.resolvePermissions();

			expect(result).toEqual([]);
		});

		it('should return the permissions of a role with no sub roles', () => {
			const role = roleFactory.build({ permissions: [permissionA, permissionB] });

			const result = role.resolvePermissions();

			expect(result).toEqual([permissionA, permissionB]);
		});

		it('should return the unique permissions of nested sub roles', () => {
			const roleC = roleFactory.build({ permissions: [permissionC, permissionA] });
			const roleB = roleFactory.build({ permissions: [permissionB], roles: [roleC] });
			const role = roleFactory.build({ permissions: [permissionA], roles: [roleB] });

			const permissions = role.resolvePermissions();

			expect(permissions.sort()).toEqual([permissionA, permissionB, permissionC].sort());
		});
	});
});
