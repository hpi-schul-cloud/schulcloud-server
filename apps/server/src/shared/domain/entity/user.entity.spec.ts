import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { roleFactory, schoolEntityFactory, setupEntities, userFactory } from '@shared/testing';
import { Role, SchoolEntity } from '.';
import { LanguageType, Permission, RoleName } from '../interface';
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
			const school = schoolEntityFactory.build();
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

		it('should throw an error if the school is not populated', () => {
			const user = userFactory.build();
			user.school = orm.em.getReference(SchoolEntity, new ObjectId().toHexString());

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

	describe('when user is an admin', () => {
		describe('when school permissions are false', () => {
			const setup = () => {
				const role = roleFactory.build({
					name: RoleName.ADMINISTRATOR,
					permissions: [permissionA, Permission.STUDENT_LIST, Permission.LERNSTORE_VIEW],
				});
				const school = schoolEntityFactory.build({
					permissions: {
						teacher: { [Permission.STUDENT_LIST]: false },
						student: { [Permission.LERNSTORE_VIEW]: false },
					},
				});
				const user = userFactory.build({ roles: [role], school });

				return { user };
			};

			it('should return the permissions of the user and not remove the school permissions', () => {
				const { user } = setup();

				const result = user.resolvePermissions();

				expect(result.sort()).toEqual([permissionA, Permission.STUDENT_LIST, Permission.LERNSTORE_VIEW].sort());
			});
		});
	});

	describe('when user is a teacher', () => {
		describe('when TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE is true', () => {
			const setupConfig = () => {
				Configuration.set('TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE', true);
			};

			describe('when school permissions STUDENT_LIST is true', () => {
				const setup = () => {
					setupConfig();

					const role = roleFactory.build({ name: RoleName.TEACHER, permissions: [permissionA] });
					const school = schoolEntityFactory.build({
						permissions: { teacher: { [Permission.STUDENT_LIST]: true } },
					});
					const user = userFactory.build({ roles: [role], school });

					return { user };
				};

				it('should return the permissions of the user including STUDENT_LIST permission', () => {
					const { user } = setup();

					const result = user.resolvePermissions();

					expect(result.sort()).toEqual([permissionA, Permission.STUDENT_LIST].sort());
				});
			});

			describe('when school permissions STUDENT_LIST is false', () => {
				const setup = () => {
					setupConfig();

					const role = roleFactory.build({
						name: RoleName.TEACHER,
						permissions: [permissionA, Permission.STUDENT_LIST],
					});
					const school = schoolEntityFactory.build({
						permissions: {
							teacher: { [Permission.STUDENT_LIST]: false },
							student: { [Permission.LERNSTORE_VIEW]: true },
						},
					});
					const user = userFactory.build({ roles: [role], school });

					return { user };
				};

				it('should return the permissions of the user without STUDENT_LIST permission', () => {
					const { user } = setup();

					const result = user.resolvePermissions();

					expect(result.sort()).toEqual([permissionA].sort());
				});
			});

			describe('when school permissions are not set', () => {
				const setup = () => {
					setupConfig();

					const role = roleFactory.build({
						name: RoleName.TEACHER,
						permissions: [permissionA, Permission.STUDENT_LIST],
					});
					const school = schoolEntityFactory.build({ permissions: undefined });
					const user = userFactory.build({ roles: [role], school });

					return { user };
				};

				it('should return the permissions of the user without STUDENT_LIST permission', () => {
					const { user } = setup();

					const result = user.resolvePermissions();

					expect(result.sort()).toEqual([permissionA].sort());
				});
			});
		});
		describe('when TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE is false', () => {
			const setupConfig = () => {
				Configuration.set('TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE', false);
			};

			describe('when TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT is true', () => {
				const setup = () => {
					setupConfig();
					Configuration.set('TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT', true);

					const role = roleFactory.build({ name: RoleName.TEACHER, permissions: [permissionA] });
					const school = schoolEntityFactory.build();
					const user = userFactory.build({ roles: [role], school });

					return { user };
				};

				it('should return the permissions of the user including STUDENT_LIST permission', () => {
					const { user } = setup();

					const result = user.resolvePermissions();

					expect(result.sort()).toEqual([permissionA, Permission.STUDENT_LIST].sort());
				});
			});

			describe('when TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT is false', () => {
				const setup = () => {
					setupConfig();
					Configuration.set('TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT', false);

					const role = roleFactory.build({
						name: RoleName.TEACHER,
						permissions: [permissionA, Permission.STUDENT_LIST],
					});
					const school = schoolEntityFactory.build();
					const user = userFactory.build({ roles: [role], school });

					return { user };
				};

				it('should return the permissions of the user without STUDENT_LIST permission', () => {
					const { user } = setup();

					const result = user.resolvePermissions();

					expect(result.sort()).toEqual([permissionA].sort());
				});
			});
		});
	});

	describe('when user is a student', () => {
		describe('when school permissions `LERNSTORE_VIEW` is true', () => {
			const setup = () => {
				const role = roleFactory.build({ name: RoleName.STUDENT, permissions: [permissionA] });
				const school = schoolEntityFactory.build({
					permissions: { teacher: { [Permission.STUDENT_LIST]: true }, student: { [Permission.LERNSTORE_VIEW]: true } },
				});
				const user = userFactory.build({ roles: [role], school });

				return { user };
			};

			it('should return the permissions of the user and the school permissions', () => {
				const { user } = setup();

				const result = user.resolvePermissions();

				expect(result.sort()).toEqual([permissionA, Permission.LERNSTORE_VIEW].sort());
			});
		});

		describe('when school permissions `LERNSTORE_VIEW` is false', () => {
			const setup = () => {
				const role = roleFactory.build({
					name: RoleName.STUDENT,
					permissions: [permissionA, Permission.LERNSTORE_VIEW],
				});
				const school = schoolEntityFactory.build({
					permissions: {
						teacher: { [Permission.STUDENT_LIST]: true },
						student: { [Permission.LERNSTORE_VIEW]: false },
					},
				});
				const user = userFactory.build({ roles: [role], school });

				return { user };
			};

			it('should return the permissions of the user and the school permissions', () => {
				const { user } = setup();

				const result = user.resolvePermissions();

				expect(result.sort()).toEqual([permissionA].sort());
			});
		});
	});

	describe('getRoles', () => {
		const setup = () => {
			const roles = roleFactory.buildListWithId(2);
			const user = userFactory.build({ roles });

			return { user };
		};

		it('should return the roles as array', () => {
			const { user } = setup();

			const result = user.getRoles();

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(2);
			expect(result[0]).toBeInstanceOf(Role);
		});
	});

	describe('getInfo', () => {
		const setup = () => {
			const expectedResult = {
				customAvatarBackgroundColor: '#fe8a71',
				firstName: 'a',
				lastName: 'b',
				id: '',
				language: LanguageType.EN,
			};

			const user = userFactory.buildWithId(expectedResult);
			expectedResult.id = user.id;

			return { user, expectedResult };
		};

		it('should return a less critical subset of informations about the user', () => {
			const { user, expectedResult } = setup();

			const result = user.getInfo();

			expect(result).toEqual(expectedResult);
		});
	});
});
