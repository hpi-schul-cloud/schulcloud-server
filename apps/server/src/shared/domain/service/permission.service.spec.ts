import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { PermissionService } from '.';
import { Role } from '../entity/role.entity';
import { Permission } from '../interface';

describe('resolvePermissions', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let service: PermissionService;

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			providers: [PermissionService],
		}).compile();

		service = await module.get(PermissionService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should return permissions of a user with one role', () => {
		const role = roleFactory.build({ permissions: [Permission.CALENDAR_EDIT] });
		const user = userFactory.build({ roles: [role] });

		const permissions = service.resolvePermissions(user);

		expect(permissions).toEqual([Permission.CALENDAR_EDIT]);
	});

	it('should return permissions of a user with many roles', () => {
		const roleA = roleFactory.build({ permissions: [Permission.CALENDAR_EDIT] });
		const roleB = roleFactory.build({ permissions: [Permission.CALENDAR_CREATE] });
		const user = userFactory.build({ roles: [roleA, roleB] });

		const permissions = service.resolvePermissions(user);

		expect(permissions.sort()).toEqual([Permission.CALENDAR_EDIT, Permission.CALENDAR_CREATE].sort());
	});

	it('should return unique permissions', () => {
		const roleA = roleFactory.build({ permissions: [Permission.CALENDAR_EDIT, Permission.CALENDAR_CREATE] });
		const roleB = roleFactory.build({ permissions: [Permission.CALENDAR_CREATE, Permission.CALENDAR_VIEW] });
		const user = userFactory.build({ roles: [roleA, roleB] });

		const permissions = service.resolvePermissions(user);

		expect(permissions.sort()).toEqual(
			[Permission.CALENDAR_VIEW, Permission.CALENDAR_EDIT, Permission.CALENDAR_CREATE].sort()
		);
	});

	it('should return the permissions of the 1st level sub role', () => {
		const roleB = roleFactory.build({ permissions: [Permission.CALENDAR_EDIT] });
		const roleA = roleFactory.build({ permissions: [Permission.CALENDAR_VIEW], roles: [roleB] });
		const user = userFactory.build({ roles: [roleA] });

		const permissions = service.resolvePermissions(user);

		expect(permissions.sort()).toEqual([Permission.CALENDAR_VIEW, Permission.CALENDAR_EDIT].sort());
	});

	it('should return the permissions of nested sub roles', () => {
		const roleC = roleFactory.build({ permissions: [Permission.CALENDAR_CREATE] });
		const roleB = roleFactory.build({ permissions: [Permission.CALENDAR_EDIT], roles: [roleC] });
		const roleA = roleFactory.build({ permissions: [Permission.CALENDAR_VIEW], roles: [roleB] });
		const user = userFactory.build({ roles: [roleA] });

		const permissions = service.resolvePermissions(user);

		expect(permissions.sort()).toEqual(
			[Permission.CALENDAR_VIEW, Permission.CALENDAR_EDIT, Permission.CALENDAR_CREATE].sort()
		);
	});

	it('should return unique permissions of nested sub roles', () => {
		const roleC = roleFactory.build({ permissions: [Permission.CALENDAR_CREATE, Permission.CALENDAR_VIEW] });
		const roleB = roleFactory.build({ permissions: [Permission.CALENDAR_EDIT], roles: [roleC] });
		const roleA = roleFactory.build({ permissions: [Permission.CALENDAR_VIEW], roles: [roleB] });
		const user = userFactory.build({ roles: [roleA] });

		const permissions = service.resolvePermissions(user);

		expect(permissions.sort()).toEqual(
			[Permission.CALENDAR_VIEW, Permission.CALENDAR_EDIT, Permission.CALENDAR_CREATE].sort()
		);
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

	describe('School authorization', () => {
		describe('[hasUserAllSchoolPermissions]', () => {
			it('should fail, when no permissions are given to be checked', () => {
				const user = userFactory.build();
				const result = service.hasUserAllSchoolPermissions(user, []);
				expect(result).toEqual(false);
			});
			it('should fail, when no permissions (array) is given to be checked', () => {
				const user = userFactory.build();
				const result = service.hasUserAllSchoolPermissions(user, 'foo' as unknown as []);
				expect(result).toEqual(false);
			});
			it('should succeed when user has all given permissions', () => {
				const role = roleFactory.build({ permissions: [Permission.CALENDAR_VIEW, Permission.CALENDAR_EDIT] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasUserAllSchoolPermissions(user, [Permission.CALENDAR_VIEW, Permission.CALENDAR_EDIT]);
				expect(result).toEqual(true);
			});
			it('should fail when user has some given permissions only', () => {
				const role = roleFactory.build({ permissions: [Permission.CALENDAR_VIEW] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasUserAllSchoolPermissions(user, [Permission.CALENDAR_VIEW, Permission.CALENDAR_EDIT]);
				expect(result).toEqual(false);
			});
			it('should fail when user has none given permissions', () => {
				const role = roleFactory.build({ permissions: [] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasUserAllSchoolPermissions(user, [Permission.CALENDAR_VIEW, Permission.CALENDAR_EDIT]);
				expect(result).toEqual(false);
			});
			it('should fail when user has only different than the given permissions', () => {
				const role = roleFactory.build({ permissions: [Permission.CALENDAR_CREATE] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasUserAllSchoolPermissions(user, [Permission.CALENDAR_VIEW]);
				expect(result).toEqual(false);
			});
		});
	});
});
