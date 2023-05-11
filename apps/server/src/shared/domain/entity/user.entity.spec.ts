import { MikroORM } from '@mikro-orm/core';
import { roleFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { Role } from '.';
import { Permission } from '..';
import { User } from './user.entity';

describe('User Entity', () => {
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
			const test = () => new User();

			expect(test).toThrow();
		});

		it('should create a user when passing required properties', () => {
			const school = schoolFactory.build();
			const user = new User({
				firstName: 'John',
				lastName: 'Cale',
				email: 'john.cale@velvet.underground',
				school,
				roles: [],
			});

			expect(user).toBeInstanceOf(User);
		});
	});

	describe('resolvePermissions', () => {
		it('should throw an error if the roles are not populated', () => {
			const user = userFactory.build();
			user.roles.set([orm.em.getReference(Role, new ObjectId().toHexString())]);

			expect(() => user.resolvePermissions()).toThrowError();
		});

		it('should throw an error if the sub-roles are not populated', () => {
			const role = roleFactory.build();
			role.roles.set([orm.em.getReference(Role, new ObjectId().toHexString())]);
			const user = userFactory.build({ roles: [role] });

			expect(() => user.resolvePermissions()).toThrowError();
		});

		it('should return empty array if the user has no roles', () => {
			const user = userFactory.build();

			const permissions = user.resolvePermissions();

			expect(permissions).toEqual([]);
		});

		it('should return permissions of a user with one role', () => {
			const role = roleFactory.build({ permissions: [permissionA] });
			const user = userFactory.build({ roles: [role] });

			const permissions = user.resolvePermissions();

			expect(permissions).toEqual([permissionA]);
		});

		it('should return the unique permissions of a user with many roles', () => {
			const roleA = roleFactory.build({ permissions: [permissionA, permissionB] });
			const roleB = roleFactory.build({ permissions: [permissionB, permissionC] });
			const user = userFactory.build({ roles: [roleA, roleB] });

			const permissions = user.resolvePermissions();

			expect(permissions.sort()).toEqual([permissionA, permissionB, permissionC].sort());
		});

		it('should return the unique permissions of nested sub roles', () => {
			const roleC = roleFactory.build({ permissions: [permissionC, permissionA] });
			const roleB = roleFactory.build({ permissions: [permissionB], roles: [roleC] });
			const roleA = roleFactory.build({ permissions: [permissionA], roles: [roleB] });
			const user = userFactory.build({ roles: [roleA] });

			const permissions = user.resolvePermissions();

			expect(permissions.sort()).toEqual([permissionA, permissionB, permissionC].sort());
		});
	});
});
