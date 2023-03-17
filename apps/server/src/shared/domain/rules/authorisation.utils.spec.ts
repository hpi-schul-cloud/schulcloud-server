import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@shared/domain/entity';
import { courseFactory, roleFactory, schoolFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { Permission, RoleName } from '../interface';
import { AuthorisationUtils } from './authorisation.utils';

class TestRule extends AuthorisationUtils {}

describe('permission.utils', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let service: AuthorisationUtils;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			providers: [TestRule],
		}).compile();

		service = await module.get(TestRule);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('[resolvePermissions]', () => {
		it('should return permissions of a user with one role', () => {
			const role = roleFactory.build({ permissions: [permissionA] });
			const user = userFactory.build({ roles: [role] });

			const permissions = service.resolvePermissions(user);

			expect(permissions).toEqual([permissionA]);
		});

		it('should return permissions of a user with many roles', () => {
			const roleA = roleFactory.build({ permissions: [permissionA] });
			const roleB = roleFactory.build({ permissions: [permissionB] });
			const user = userFactory.build({ roles: [roleA, roleB] });

			const permissions = service.resolvePermissions(user);

			expect(permissions.sort()).toEqual([permissionA, permissionB].sort());
		});

		it('should return unique permissions', () => {
			const roleA = roleFactory.build({ permissions: [permissionA, permissionB] });
			const roleB = roleFactory.build({ permissions: [permissionB, permissionC] });
			const user = userFactory.build({ roles: [roleA, roleB] });

			const permissions = service.resolvePermissions(user);

			expect(permissions.sort()).toEqual([permissionA, permissionB, permissionC].sort());
		});

		it('should return the permissions of the 1st level sub role', () => {
			const roleB = roleFactory.build({ permissions: [permissionB] });
			const roleA = roleFactory.build({ permissions: [permissionA], roles: [roleB] });
			const user = userFactory.build({ roles: [roleA] });

			const permissions = service.resolvePermissions(user);

			expect(permissions.sort()).toEqual([permissionA, permissionB].sort());
		});

		it('should return the permissions of nested sub roles', () => {
			const roleC = roleFactory.build({ permissions: [permissionC] });
			const roleB = roleFactory.build({ permissions: [permissionB], roles: [roleC] });
			const roleA = roleFactory.build({ permissions: [permissionA], roles: [roleB] });
			const user = userFactory.build({ roles: [roleA] });

			const permissions = service.resolvePermissions(user);

			expect(permissions.sort()).toEqual([permissionA, permissionB, permissionC].sort());
		});

		it('should return unique permissions of nested sub roles', () => {
			const roleC = roleFactory.build({ permissions: [permissionC, permissionA] });
			const roleB = roleFactory.build({ permissions: [permissionB], roles: [roleC] });
			const roleA = roleFactory.build({ permissions: [permissionA], roles: [roleB] });
			const user = userFactory.build({ roles: [roleA] });

			const permissions = service.resolvePermissions(user);

			expect(permissions.sort()).toEqual([permissionA, permissionB, permissionC].sort());
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
				expect(result).toEqual(true);
			});
			it('should succeed when user has all given permissions', () => {
				const role = roleFactory.build({ permissions: [permissionA, permissionB] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasAllPermissions(user, [permissionA, permissionB]);
				expect(result).toEqual(true);
			});
			it('should fail when user has some given permissions only', () => {
				const role = roleFactory.build({ permissions: [permissionA] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasAllPermissions(user, [permissionA, permissionB]);
				expect(result).toEqual(false);
			});
			it('should fail when user has none given permissions', () => {
				const role = roleFactory.build({ permissions: [] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasAllPermissions(user, [permissionA, permissionB]);
				expect(result).toEqual(false);
			});
			it('should fail when user has only different than the given permissions', () => {
				const role = roleFactory.build({ permissions: [permissionC] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasAllPermissions(user, [permissionA]);
				expect(result).toEqual(false);
			});
		});

		describe('[hasAllPermissionsByRole]', () => {
			describe('WHEN roles are inherited', () => {
				const setup = () => {
					const roleA = roleFactory.buildWithId({ permissions: [permissionA] });
					const roleB = roleFactory.buildWithId({ permissions: [permissionB], roles: [roleA] });
					const role = roleFactory.buildWithId({ permissions: [permissionC], roles: [roleB] });
					return {
						role,
					};
				};
				it('should return true by permissionA', () => {
					const { role } = setup();

					const result = service.hasAllPermissionsByRole(role, [permissionA]);
					expect(result).toEqual(true);
				});

				it('should return true by permissionB', () => {
					const { role } = setup();

					const result = service.hasAllPermissionsByRole(role, [permissionB]);
					expect(result).toEqual(true);
				});
				it('should return true by permissionC', () => {
					const { role } = setup();

					const result = service.hasAllPermissionsByRole(role, [permissionC]);
					expect(result).toEqual(true);
				});

				it('should return false by permissionNotFound', () => {
					const { role } = setup();
					const permissionNotFound = 'notFound' as Permission;

					const result = service.hasAllPermissionsByRole(role, [permissionNotFound]);
					expect(result).toEqual(false);
				});
			});
		});

		describe('[checkAllPermissions]', () => {
			it('should throw when hasAllPermissions is false', () => {
				const user = userFactory.build();
				const spy = jest.spyOn(service, 'hasAllPermissions').mockReturnValue(false);
				expect(() => service.checkAllPermissions(user, [permissionA])).toThrowError(UnauthorizedException);
				spy.mockRestore();
			});
			it('should not throw when hasAllPermissions is true', () => {
				const user = userFactory.build();
				const spy = jest.spyOn(service, 'hasAllPermissions').mockReturnValue(true);
				service.checkAllPermissions(user, [permissionA]);
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
				const role = roleFactory.build({ permissions: [permissionA, permissionB] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasOneOfPermissions(user, [permissionA, permissionB]);
				expect(result).toEqual(true);
			});
			it('should success when user has some given permissions only', () => {
				const role = roleFactory.build({ permissions: [permissionA] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasOneOfPermissions(user, [permissionA, permissionB]);
				expect(result).toEqual(true);
			});
			it('should fail when user has none given permissions', () => {
				const role = roleFactory.build({ permissions: [] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasOneOfPermissions(user, [permissionA, permissionB]);
				expect(result).toEqual(false);
			});
			it('should fail when user has only different than the given permissions', () => {
				const role = roleFactory.build({ permissions: [permissionC] });
				const user = userFactory.build({ roles: [role] });
				const result = service.hasOneOfPermissions(user, [permissionA]);
				expect(result).toEqual(false);
			});
		});

		describe('[checkOneOfPermissions]', () => {
			it('should throw when hasOneOfPermissions is false', () => {
				const user = userFactory.build();
				const spy = jest.spyOn(service, 'hasOneOfPermissions').mockReturnValue(false);
				expect(() => service.checkOneOfPermissions(user, [permissionA])).toThrowError(UnauthorizedException);
				spy.mockRestore();
			});
			it('should not throw when hasOneOfPermissions is true', () => {
				const user = userFactory.build();
				const spy = jest.spyOn(service, 'hasOneOfPermissions').mockReturnValue(true);
				service.checkOneOfPermissions(user, [permissionA]);
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
			const role = roleFactory.build({ name: RoleName.STUDENT });
			const user = userFactory.build({ roles: [role] });

			const permissions = service.hasRole(user, RoleName.STUDENT);

			expect(permissions).toEqual(true);
		});

		it('should return "true" if a user with many roles', () => {
			const roleA = roleFactory.build({ name: RoleName.STUDENT });
			const roleB = roleFactory.build({ name: RoleName.TEACHER });
			const user = userFactory.build({ roles: [roleA, roleB] });

			const permissions = service.hasRole(user, RoleName.TEACHER);

			expect(permissions).toEqual(true);
		});

		it('should return false if a user has not a role ', () => {
			const roleA = roleFactory.build({ name: RoleName.STUDENT });
			const roleB = roleFactory.build({ name: RoleName.TEACHER });
			const user = userFactory.build({ roles: [roleA, roleB] });

			const permissions = service.hasRole(user, RoleName.ADMINISTRATOR);

			expect(permissions).toEqual(false);
		});

		it('should throw an error if the roles are not populated', () => {
			const user = userFactory.build();
			user.roles.set([orm.em.getReference(Role, new ObjectId().toHexString())]);

			expect(() => service.hasRole(user, RoleName.ADMINISTRATOR)).toThrowError();
		});
	});
});
