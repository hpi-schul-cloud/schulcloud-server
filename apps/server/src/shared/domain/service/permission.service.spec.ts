import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, roleFactory, schoolFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { PermissionService } from '.';
import { Role } from '../entity/role.entity';

describe('permissions.service', () => {
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
	describe('[resolvePermissions]', () => {
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
	describe('Authorization', () => {
		describe('[hasAllPermissions]', () => {
			it('should fail, when no permissions are given to be checked', () => {
				const user = userFactory.build();
				const result = service.hasAllPermissions(user, []);
				expect(result).toEqual(false);
			});
			it('should fail, when no permissions (array) is given to be checked', () => {
				const user = userFactory.build();
				const result = service.hasAllPermissions(user, 'foo' as unknown as []);
				expect(result).toEqual(false);
			});
			it('should succeed when user has all given permissions', () => {
				const role = roleFactory.build({ permissions: ['permission1', 'permission2'] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasAllPermissions(user, ['permission1', 'permission2']);
				expect(result).toEqual(true);
			});
			it('should fail when user has some given permissions only', () => {
				const role = roleFactory.build({ permissions: ['permission1'] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasAllPermissions(user, ['permission1', 'permission2']);
				expect(result).toEqual(false);
			});
			it('should fail when user has none given permissions', () => {
				const role = roleFactory.build({ permissions: [] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasAllPermissions(user, ['permission1', 'permission2']);
				expect(result).toEqual(false);
			});
			it('should fail when user has only different than the given permissions', () => {
				const role = roleFactory.build({ permissions: ['permission3'] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasAllPermissions(user, ['permission1']);
				expect(result).toEqual(false);
			});
		});

		describe('[checkAllPermissions]', () => {
			it('should throw when hasAllPermissions is false', () => {
				const user = userFactory.build();
				const spy = jest.spyOn(service, 'hasAllPermissions').mockReturnValue(false);
				expect(() => service.checkAllPermissions(user, ['permission1'])).toThrowError(UnauthorizedException);
				spy.mockRestore();
			});
			it('should not throw when hasAllPermissions is true', () => {
				const user = userFactory.build();
				const spy = jest.spyOn(service, 'hasAllPermissions').mockReturnValue(true);
				service.checkAllPermissions(user, ['permission1']);
				spy.mockRestore();
			});
		});

		describe('[hasOneOfPermissions]', () => {
			it('should fail, when no permissions are given to be checked', () => {
				const user = userFactory.build();
				const result = service.hasOneOfPermissions(user, []);
				expect(result).toEqual(false);
			});
			it('should fail, when no permissions (array) is given to be checked', () => {
				const user = userFactory.build();
				const result = service.hasOneOfPermissions(user, 'foo' as unknown as []);
				expect(result).toEqual(false);
			});
			it('should succeed when user has all given permissions', () => {
				const role = roleFactory.build({ permissions: ['permission1', 'permission2'] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasOneOfPermissions(user, ['permission1', 'permission2']);
				expect(result).toEqual(true);
			});
			it('should success when user has some given permissions only', () => {
				const role = roleFactory.build({ permissions: ['permission1'] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasOneOfPermissions(user, ['permission1', 'permission2']);
				expect(result).toEqual(true);
			});
			it('should fail when user has none given permissions', () => {
				const role = roleFactory.build({ permissions: [] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasOneOfPermissions(user, ['permission1', 'permission2']);
				expect(result).toEqual(false);
			});
			it('should fail when user has only different than the given permissions', () => {
				const role = roleFactory.build({ permissions: ['permission3'] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasOneOfPermissions(user, ['permission1']);
				expect(result).toEqual(false);
			});
		});

		describe('[checkOneOfPermissions]', () => {
			it('should throw when hasOneOfPermissions is false', () => {
				const user = userFactory.build();
				const spy = jest.spyOn(service, 'hasOneOfPermissions').mockReturnValue(false);
				expect(() => service.checkOneOfPermissions(user, ['permission1'])).toThrowError(UnauthorizedException);
				spy.mockRestore();
			});
			it('should not throw when hasOneOfPermissions is true', () => {
				const user = userFactory.build();
				const spy = jest.spyOn(service, 'hasOneOfPermissions').mockReturnValue(true);
				service.checkOneOfPermissions(user, ['permission1']);
				spy.mockRestore();
			});
		});
	});

	describe('[hasAccessToEntity]', () => {
		describe('if entity prop is instance of Collection', () => {
			it('should return true if user is contained in prop', () => {
				const user = userFactory.build();
				const course = courseFactory.build({ students: [user] });

				const permissions = service.hasAccessToEntity(user, course, ['students']);

				expect(permissions).toEqual(true);
			});
			it('should return true if user is contained in both prop', () => {
				const user = userFactory.build();
				const course = courseFactory.build({ students: [user], teachers: [user] });

				const permissions = service.hasAccessToEntity(user, course, ['students', 'teachers']);
				expect(permissions).toEqual(true);
			});
			it('should return false if user is not contained in prop', () => {
				const user = userFactory.build();
				const course = courseFactory.build({ students: [user], teachers: [user] });

				const permissions = service.hasAccessToEntity(user, course, ['substitutionTeachers']);
				expect(permissions).toEqual(false);
			});
		});

		describe('if entity prop is instance of User', () => {
			it('should return true if user is equal user in prop', () => {
				const user = userFactory.build();
				const task = taskFactory.build({ creator: user });

				const permissions = service.hasAccessToEntity(user, task, ['creator']);

				expect(permissions).toEqual(true);
			});

			it('should return false if user is not equal user in prop', () => {
				const user = userFactory.build();
				const user2 = userFactory.build();
				const task = taskFactory.build({ creator: user2 });

				const permissions = service.hasAccessToEntity(user, task, ['creator']);

				expect(permissions).toEqual(false);
			});
		});

		describe('if entity prop is instance of ObjectId', () => {
			it('should return true if user is equal user in prop', () => {
				const user = userFactory.build();

				const permissions = service.hasAccessToEntity(user, user, ['id']);
				expect(permissions).toEqual(true);
			});

			it('should return false if user is not equal user in prop', () => {
				const user = userFactory.buildWithId();
				const user2 = userFactory.buildWithId();
				const permissions = service.hasAccessToEntity(user, user2, ['id']);

				expect(permissions).toEqual(false);
			});
		});
	});

	describe('[isSameSchool]', () => {
		it('should return true if user is on same school', () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school });
			const course = courseFactory.build({ students: [user], school });

			const permissions = service.isSameSchool(user, course);

			expect(permissions).toEqual(true);
		});

		it('should return false if user is not on same school', () => {
			const school = schoolFactory.build();
			const user = userFactory.build();
			const course = courseFactory.build({ students: [user], school });

			const permissions = service.isSameSchool(user, course);

			expect(permissions).toEqual(false);
		});
	});

	describe('[checkSameSchool]', () => {
		it('should return true if user is on same school', () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school });
			const course = courseFactory.build({ students: [user], school });

			const permissions = service.checkSameSchool(user, course);

			expect(permissions).toEqual(undefined);
		});

		it('should throw a error if user is not on same school', () => {
			const school = schoolFactory.build();
			const user = userFactory.build();
			const course = courseFactory.build({ students: [user], school });

			expect(() => service.checkSameSchool(user, course)).toThrowError();
		});
	});

	describe('[hasRole]', () => {
		it('should return "true" if a user with one role', () => {
			const role = roleFactory.build({ name: 'a' });
			const user = userFactory.build({ roles: [role] });

			const permissions = service.hasRole(user, 'a');

			expect(permissions).toEqual(true);
		});

		it('should return "true" if a user with many roles', () => {
			const roleA = roleFactory.build({ name: 'a' });
			const roleB = roleFactory.build({ name: 'b' });
			const user = userFactory.build({ roles: [roleA, roleB] });

			const permissions = service.hasRole(user, 'b');

			expect(permissions).toEqual(true);
		});

		it('should return false if a user has not a role ', () => {
			const roleA = roleFactory.build({ name: 'a' });
			const roleB = roleFactory.build({ name: 'b' });
			const user = userFactory.build({ roles: [roleA, roleB] });

			const permissions = service.hasRole(user, 'c');

			expect(permissions).toEqual(false);
		});

		it('should throw an error if the roles are not populated', () => {
			const user = userFactory.build();
			user.roles.set([orm.em.getReference(Role, new ObjectId().toHexString())]);

			expect(() => service.hasRole(user, 'c')).toThrowError();
		});
	});
});
