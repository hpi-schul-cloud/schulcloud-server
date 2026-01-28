import { Logger } from '@core/logger';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { RoleDto, RoleName, RoleService } from '@modules/role';
import type { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory, schoolFactory } from '@modules/school/testing';
import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { type IFindOptions, LanguageType, Permission, SortOrder } from '@shared/domain/interface';
import type { EntityId } from '@shared/domain/types';
import { setupEntities } from '@testing/database';
import { UserDto } from '../../api/dto';
import { User, UserMikroOrmRepo } from '../../repo';
import { userDoFactory, userFactory } from '../../testing';
import { TeacherVisibilityForExternalTeamInvitation, USER_CONFIG_TOKEN, UserConfig } from '../../user.config';
import { UserDo } from '../do';
import { USER_DO_REPO, type UserDoRepo } from '../interface';
import { UserDiscoverableQuery, type UserQuery } from '../query';
import { UserService } from './user.service';

describe('UserService', () => {
	let service: UserService;
	let module: TestingModule;

	let userRepo: DeepMocked<UserMikroOrmRepo>;
	let userDoRepo: DeepMocked<UserDoRepo>;
	let roleService: DeepMocked<RoleService>;
	let config: UserConfig;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				UserService,
				{
					provide: EntityManager,
					useValue: createMock<EntityManager>(),
				},
				{
					provide: UserMikroOrmRepo,
					useValue: createMock<UserMikroOrmRepo>(),
				},
				{
					provide: USER_DO_REPO,
					useValue: createMock<UserDoRepo>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: USER_CONFIG_TOKEN,
					useValue: {},
				},
			],
		}).compile();
		service = module.get(UserService);

		userRepo = module.get(UserMikroOrmRepo);
		userDoRepo = module.get(USER_DO_REPO);
		config = module.get(USER_CONFIG_TOKEN);
		roleService = module.get(RoleService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('me', () => {
		it('should return an array with the user and its permissions', async () => {
			const permission = Permission.ACCOUNT_CREATE;
			const role = roleFactory.build({ permissions: [permission] });
			const user = userFactory.buildWithId({ roles: [role] });
			userRepo.findById.mockResolvedValue(user);
			const userSpy = jest.spyOn(user, 'resolvePermissions').mockReturnValueOnce([permission]);

			const result = await service.me(user.id);

			expect(result[0]).toEqual(user);
			expect(result[1]).toEqual([permission]);

			userSpy.mockRestore();
		});
	});

	describe('getUserEntityWithRoles', () => {
		describe('when user with roles exists', () => {
			const setup = () => {
				const roles = roleFactory.buildListWithId(2);
				const user = userFactory.buildWithId({ roles });

				userRepo.findById.mockResolvedValueOnce(user);

				return { user, userId: user.id };
			};

			it('should return the user with included roles', async () => {
				const { user, userId } = setup();

				const result = await service.getUserEntityWithRoles(userId);

				expect(result).toEqual(user);
				expect(result.getRoles()).toHaveLength(2);
			});
		});

		describe('when repo throws an error', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const error = new NotFoundException();

				userRepo.findById.mockRejectedValueOnce(error);

				return { userId, error };
			};

			it('should throw an error', async () => {
				const { userId, error } = setup();

				await expect(() => service.getUserEntityWithRoles(userId)).rejects.toThrowError(error);
			});
		});
	});

	describe('getUser', () => {
		let user: User;

		beforeEach(() => {
			user = userFactory.buildWithId({ roles: [] });
			userRepo.findById.mockResolvedValue(user);
		});

		it('should provide information about the passed userId', async () => {
			// Act
			const userDto = await service.getUser(user.id);

			// Assert
			expect(userDto).toBeDefined();
			expect(userDto).toBeInstanceOf(UserDto);
			expect(userRepo.findById).toHaveBeenCalled();
		});
	});

	describe('findById', () => {
		beforeEach(() => {
			const userDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.STUDENT }]).build({
				firstName: 'firstName',
				lastName: 'lastName',
				email: 'email',
				schoolId: 'schoolId',
				externalId: 'externalUserId',
			});
			userDoRepo.findById.mockResolvedValue(userDO);
		});

		it('should provide the userDO', async () => {
			const result = await service.findById('id');

			expect(result).toBeDefined();
			expect(result).toBeInstanceOf(UserDo);
		});
	});

	describe('findByIds', () => {
		beforeEach(() => {
			const userDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.STUDENT }]).build({
				firstName: 'firstName',
				lastName: 'lastName',
				email: 'email',
				schoolId: 'schoolId',
				externalId: 'externalUserId',
			});
			userDoRepo.findByIds.mockResolvedValue([userDO]);
		});

		it('should provide the userDOs', async () => {
			const result = await service.findByIds(['id']);

			expect(result).toBeDefined();
			expect(result).toHaveLength(1);
			expect(result[0]).toBeInstanceOf(UserDo);
		});
	});

	describe('findByIdOrNull', () => {
		describe('when a user with this id exists', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.buildWithId({ id: userId });

				userDoRepo.findByIdOrNull.mockResolvedValue(user);

				return {
					user,
					userId,
				};
			};

			it('should return the user', async () => {
				const { user, userId } = setup();

				const result = await service.findByIdOrNull(userId);

				expect(result).toEqual(user);
			});
		});

		describe('when a user with this id does not exist', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();

				userDoRepo.findByIdOrNull.mockResolvedValue(null);

				return { userId };
			};

			it('should return null', async () => {
				const { userId } = setup();

				const result = await service.findByIdOrNull(userId);

				expect(result).toBeNull();
			});
		});
	});

	describe('getDisplayName', () => {
		let role: Role;

		beforeEach(() => {
			role = roleFactory.buildWithId();
			roleService.getProtectedRoles.mockResolvedValue([role]);
		});

		it('should return only the last name when the user has a protected role', async () => {
			const user = userDoFactory.withRoles([{ id: role.id, name: RoleName.STUDENT }]).buildWithId({
				lastName: 'lastName',
			});

			const result = await service.getDisplayName(user);

			expect(result).toEqual(user.lastName);
			expect(roleService.getProtectedRoles).toHaveBeenCalled();
		});

		it('should return the first name and last name when the user has no protected role', async () => {
			const user = userDoFactory.withRoles([{ id: 'unprotectedId', name: RoleName.STUDENT }]).buildWithId({
				lastName: 'lastName',
				firstName: 'firstName',
			});

			const result = await service.getDisplayName(user);

			expect(result).toEqual(`${user.firstName} ${user.lastName}`);
			expect(roleService.getProtectedRoles).toHaveBeenCalled();
		});
	});

	describe('patchLanguage', () => {
		let user: User;

		beforeEach(() => {
			user = userFactory.buildWithId({ roles: [] });
			userRepo.findById.mockResolvedValue(user);
			config.availableLanguages = [LanguageType.DE];
		});

		it('should patch language auf passed userId', async () => {
			await service.patchLanguage(user.id, LanguageType.DE);

			expect(userRepo.findById).toHaveBeenCalledWith(user.id);
			expect(userRepo.save).toHaveBeenCalledWith(user);
		});

		it('should throw an error if language is not activated', async () => {
			await expect(service.patchLanguage(user.id, LanguageType.EN)).rejects.toThrowError();
		});
	});

	describe('save is called', () => {
		describe('when saving a new user', () => {
			const setup = () => {
				const user = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					firstName: 'firstName',
					lastName: 'lastName',
					schoolId: 'schoolId',
					email: 'email',
				});

				userDoRepo.save.mockResolvedValue(user);

				return {
					user,
				};
			};

			it('should call the userDORepo.save', async () => {
				const { user } = setup();

				await service.save(user);

				expect(userDoRepo.save).toHaveBeenCalledWith(user);
			});

			it('should return the saved user', async () => {
				const { user } = setup();

				const result = await service.save(user);

				expect(result).toEqual(user);
			});
		});
	});

	describe('saveEntity', () => {
		describe('when save is successfull', () => {
			const setup = () => {
				const user = userFactory.buildWithId();

				return {
					user,
				};
			};

			it('should call the userRepo.save', async () => {
				const { user } = setup();

				await service.saveEntity(user);

				expect(userRepo.save).toHaveBeenCalledWith(user);
			});
		});

		describe('when save is not successfull', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const error = new Error('Error');

				userRepo.save.mockRejectedValueOnce(error);

				return {
					user,
					error,
				};
			};

			it('should throw an error', async () => {
				const { user, error } = setup();

				await expect(service.saveEntity(user)).rejects.toThrowError(error);
			});
		});
	});

	describe('findByExternalId is called', () => {
		describe('when a user with this external id exists', () => {
			it('should return the user', async () => {
				const user = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					firstName: 'firstName',
					lastName: 'lastName',
					schoolId: 'schoolId',
					email: 'email',
					externalId: 'externalId',
				});

				userDoRepo.findByExternalId.mockResolvedValue(user);

				const result = await service.findByExternalId('externalId', 'systemId');

				expect(result).toEqual(user);
			});
		});

		describe('when a user with this external id does not exist', () => {
			it('should return null', async () => {
				userDoRepo.findByExternalId.mockResolvedValue(null);

				const result = await service.findByExternalId('externalId', 'systemId');

				expect(result).toEqual(null);
			});
		});
	});

	describe('findByEmail is called', () => {
		describe('when a user with this email exists', () => {
			it('should return the user', async () => {
				const user = userDoFactory.buildWithId();

				userDoRepo.findByEmail.mockResolvedValue([user]);

				const result = await service.findByEmail(user.email);

				expect(result).toEqual([user]);
			});
		});
	});

	describe('findUsers is called', () => {
		it('should call the repo with given query and options', async () => {
			const query: UserQuery = {
				schoolId: 'schoolId',
				isOutdated: true,
			};
			const options: IFindOptions<UserDo> = { order: { id: SortOrder.asc } };

			await service.findUsers(query, options);

			expect(userDoRepo.find).toHaveBeenCalledWith(query, options);
		});
	});

	describe('findBySchoolRole', () => {
		it('should call the repo with given schoolId and roleName', async () => {
			const schoolId = 'schoolId';
			const role = roleFactory.buildWithId();
			roleService.findByName.mockResolvedValue(role);

			await service.findBySchoolRole(schoolId, role.name);

			expect(userDoRepo.find).toHaveBeenCalledWith({ schoolId, roleId: role.id }, undefined);
		});
	});

	describe('findPublicTeachersBySchool', () => {
		const setup = () => {
			const school = schoolFactory.build();
			const role = roleFactory.buildWithId({ name: RoleName.TEACHER });
			const teachers = userDoFactory.buildListWithId(2, { schoolId: school.id, roles: [role] });

			const expectedResult = new Page<UserDo>(teachers, 2);
			userDoRepo.find.mockResolvedValue(expectedResult);
			roleService.findByName.mockResolvedValue(role);

			return { school, role, expectedResult };
		};

		it('should return result', async () => {
			const { expectedResult, school } = setup();
			const result = await service.findPublicTeachersBySchool(school.id);

			expect(result).toEqual(expectedResult);
		});

		//  "disabled", "opt-in", "opt-out", "enabled"
		describe('when TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION is set to "enabled"', () => {
			it('should query all teachers', async () => {
				const { school, role } = setup();
				config.teacherVisibilityForExternalTeamInvitation = TeacherVisibilityForExternalTeamInvitation.ENABLED;

				await service.findPublicTeachersBySchool(school.id);

				expect(userDoRepo.find).toHaveBeenCalledWith({ schoolId: school.id, roleId: role.id }, undefined);
			});
		});

		describe('when TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION is set to "opt-out"', () => {
			it('should query teachers that did not specifically set discoverability to false', async () => {
				const { school, role } = setup();
				config.teacherVisibilityForExternalTeamInvitation = TeacherVisibilityForExternalTeamInvitation.OPT_OUT;

				await service.findPublicTeachersBySchool(school.id);

				expect(userDoRepo.find).toHaveBeenCalledWith(
					{ schoolId: school.id, roleId: role.id, discoverable: UserDiscoverableQuery.NOT_FALSE },
					undefined
				);
			});
		});

		describe('when TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION is set to "opt-in"', () => {
			it('should query only teachers that specifically set discoverability to true', async () => {
				const { school, role } = setup();
				config.teacherVisibilityForExternalTeamInvitation = TeacherVisibilityForExternalTeamInvitation.OPT_IN;

				await service.findPublicTeachersBySchool(school.id);

				expect(userDoRepo.find).toHaveBeenCalledWith(
					{ schoolId: school.id, roleId: role.id, discoverable: UserDiscoverableQuery.TRUE },
					undefined
				);
			});
		});

		describe('when TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION is set to "disabled"', () => {
			it('should return empty result', async () => {
				const { school } = setup();
				config.teacherVisibilityForExternalTeamInvitation = TeacherVisibilityForExternalTeamInvitation.DISABLED;

				const result = await service.findPublicTeachersBySchool(school.id);

				expect(result).toEqual(expect.objectContaining({ data: [], total: 0 }));
			});
		});
	});

	describe('findForImportUser', () => {
		describe('when find is successfull', () => {
			it('should call the repo with given school and filters', async () => {
				const school = schoolEntityFactory.build();
				const userName = 'name';
				const options: IFindOptions<UserDo> = { order: { id: SortOrder.asc } };

				await service.findForImportUser(school, userName, options);

				expect(userRepo.findForImportUser).toHaveBeenCalledWith(school, userName, options);
			});
		});

		describe('when find is not successfull', () => {
			it('should call the repo with given school and filters', async () => {
				const school = schoolEntityFactory.build();
				const userName = 'name';
				const options: IFindOptions<UserDo> = { order: { id: SortOrder.asc } };
				const error = new Error('Error');
				userRepo.findForImportUser.mockRejectedValueOnce(error);

				await expect(service.findForImportUser(school, userName, options)).rejects.toThrowError(error);
			});
		});
	});

	describe('updateSecondarySchoolRole', () => {
		const setupGuestRoles = () => {
			const guestTeacher = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });
			const guestStudent = roleFactory.buildWithId({ name: RoleName.GUESTSTUDENT });
			const guestExternalPerson = roleFactory.buildWithId({ name: RoleName.GUESTEXTERNALPERSON });

			roleService.findByName.mockImplementation((name) => {
				if (name === RoleName.GUESTTEACHER) {
					return Promise.resolve(new RoleDto(guestTeacher));
				}
				if (name === RoleName.GUESTSTUDENT) {
					return Promise.resolve(new RoleDto(guestStudent));
				}
				if (name === RoleName.GUESTEXTERNALPERSON) {
					return Promise.resolve(new RoleDto(guestExternalPerson));
				}
				throw new Error('Unexpected role name');
			});

			return { guestTeacher, guestStudent, guestExternalPerson };
		};

		describe('when user is not in targetSchool yet', () => {
			const setupUserWithRole = (rolename: RoleName) => {
				const role = roleFactory.buildWithId({ name: rolename });
				const user = userDoFactory.buildWithId({ roles: [role] });
				const targetSchool = schoolFactory.build();

				userDoRepo.findByIds.mockResolvedValueOnce([user]);

				return { user, role, targetSchool };
			};

			it('should add teacher as guestteacher to school', async () => {
				const { user, targetSchool } = setupUserWithRole(RoleName.TEACHER);
				const { guestTeacher } = setupGuestRoles();

				await service.addSecondarySchoolToUsers([user.id as string], targetSchool.id);

				expect(userDoRepo.saveAll).toHaveBeenCalledWith([
					expect.objectContaining<Partial<UserDo>>({
						secondarySchools: [
							{ schoolId: targetSchool.id, role: { id: guestTeacher.id, name: RoleName.GUESTTEACHER } },
						],
					}),
				]);
			});

			it('should add admin as guestteacher to school', async () => {
				const { user, targetSchool } = setupUserWithRole(RoleName.ADMINISTRATOR);
				const { guestTeacher } = setupGuestRoles();

				await service.addSecondarySchoolToUsers([user.id as string], targetSchool.id);

				expect(userDoRepo.saveAll).toHaveBeenCalledWith([
					expect.objectContaining<Partial<UserDo>>({
						secondarySchools: [
							{ schoolId: targetSchool.id, role: { id: guestTeacher.id, name: RoleName.GUESTTEACHER } },
						],
					}),
				]);
			});

			it('should add student as gueststudent to school', async () => {
				const { user, targetSchool } = setupUserWithRole(RoleName.STUDENT);
				const { guestStudent } = setupGuestRoles();

				await service.addSecondarySchoolToUsers([user.id as string], targetSchool.id);

				expect(userDoRepo.saveAll).toHaveBeenCalledWith([
					expect.objectContaining<Partial<UserDo>>({
						secondarySchools: [
							{ schoolId: targetSchool.id, role: { id: guestStudent.id, name: RoleName.GUESTSTUDENT } },
						],
					}),
				]);
			});

			it('should add external person as guestexternalperson to school', async () => {
				const { user, targetSchool } = setupUserWithRole(RoleName.EXTERNALPERSON);
				const { guestExternalPerson } = setupGuestRoles();

				await service.addSecondarySchoolToUsers([user.id as string], targetSchool.id);

				expect(userDoRepo.saveAll).toHaveBeenCalledWith([
					expect.objectContaining<Partial<UserDo>>({
						secondarySchools: [
							{ schoolId: targetSchool.id, role: { id: guestExternalPerson.id, name: RoleName.GUESTEXTERNALPERSON } },
						],
					}),
				]);
			});

			it('should throw when user has no recognized role', async () => {
				const { user, targetSchool } = setupUserWithRole(RoleName.USER);
				setupGuestRoles();

				await expect(() =>
					service.addSecondarySchoolToUsers([user.id as string], targetSchool.id)
				).rejects.toThrowError();
			});
		});

		describe('when user is already in targetSchool', () => {
			const setup = () => {
				const targetSchool = schoolFactory.build();
				const role = roleFactory.buildWithId({ name: RoleName.TEACHER });
				const user = userDoFactory.buildWithId({ roles: [role], schoolId: targetSchool.id });

				userDoRepo.findByIds.mockResolvedValueOnce([user]);

				return { user, targetSchool };
			};

			it('should not change the user', async () => {
				const { user, targetSchool } = setup();
				setupGuestRoles();

				await service.addSecondarySchoolToUsers([user.id as string], targetSchool.id);

				expect(userDoRepo.saveAll).toHaveBeenCalledWith(
					expect.arrayContaining([expect.objectContaining({ id: user.id, secondarySchools: [] })])
				);
			});
		});

		describe('when user is already a guest in targetSchool', () => {
			const setup = () => {
				const targetSchool = schoolFactory.build();
				const role = roleFactory.buildWithId({ name: RoleName.TEACHER });
				const guestRole = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });
				const user = userDoFactory.buildWithId({
					roles: [role],
					secondarySchools: [{ schoolId: targetSchool.id, role: new RoleDto(guestRole) }],
				});

				userDoRepo.findByIds.mockResolvedValueOnce([user]);

				return { user, targetSchool };
			};

			it('should not change the user', async () => {
				const { user, targetSchool } = setup();
				setupGuestRoles();
				const expectedSecondarySchools = [...user.secondarySchools];

				await service.addSecondarySchoolToUsers([user.id as string], targetSchool.id);

				expect(userDoRepo.saveAll).toHaveBeenCalledWith(
					expect.arrayContaining([expect.objectContaining({ id: user.id, secondarySchools: expectedSecondarySchools })])
				);
			});
		});
	});

	describe('removeSecondarySchool', () => {
		describe('when user is guest in targetSchool', () => {
			const setup = () => {
				const targetSchool = schoolFactory.build();
				const role = roleFactory.buildWithId({ name: RoleName.TEACHER });
				const guestTeacher = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });
				const user = userDoFactory.buildWithId({
					roles: [role],
					secondarySchools: [{ schoolId: targetSchool.id, role: new RoleDto(guestTeacher) }],
				});

				userDoRepo.findByIds.mockResolvedValueOnce([user]);

				return { user, targetSchool, guestTeacher };
			};

			it('should remove user from secondary school', async () => {
				const { user, targetSchool } = setup();

				await service.removeSecondarySchoolFromUsers([user.id as EntityId], targetSchool.id);

				expect(userDoRepo.saveAll).toHaveBeenCalledWith(
					expect.arrayContaining([expect.objectContaining({ id: user.id, secondarySchools: [] })])
				);
			});
		});
	});

	describe('saveAll is called', () => {
		it('should call the repo with given users', async () => {
			const users = [userDoFactory.buildWithId()];

			await service.saveAll(users);

			expect(userDoRepo.saveAll).toHaveBeenCalledWith(users);
		});
	});

	describe('deleteUser', () => {
		describe('when user is successfully deleted', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();

				userRepo.deleteUser.mockResolvedValueOnce(1);

				return { userId };
			};

			it('should return true', async () => {
				const { userId } = setup();

				const result = await service.deleteUser(userId);

				expect(result).toBe(true);
				expect(userRepo.deleteUser).toHaveBeenCalledWith(userId);
			});
		});

		describe(`when user was not deleted`, () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();

				userRepo.deleteUser.mockResolvedValueOnce(0);

				return { userId };
			};

			it('should return false', async () => {
				const { userId } = setup();

				const result = await service.deleteUser(userId);

				expect(result).toBe(false);
				expect(userRepo.deleteUser).toHaveBeenCalledWith(userId);
			});
		});
	});

	describe('getParentEmailsFromUser', () => {
		const setup = () => {
			const user = userFactory.asStudent().buildWithId();
			const parentEmail = ['test@test.eu'];

			userRepo.getParentEmailsFromUser.mockResolvedValue(parentEmail);

			return {
				user,
				parentEmail,
			};
		};

		it('should call userRepo.getParentEmailsFromUse', async () => {
			const { user } = setup();

			await service.getParentEmailsFromUser(user.id);

			expect(userRepo.getParentEmailsFromUser).toBeCalledWith(user.id);
		});

		it('should return array with parent emails', async () => {
			const { user, parentEmail } = setup();

			const result = await service.getParentEmailsFromUser(user.id);
			expect(result).toEqual(parentEmail);
		});
	});

	describe('findUserBySchoolAndName', () => {
		describe('when searching for users by school and name', () => {
			const setup = () => {
				const firstName = 'Frist';
				const lastName = 'Last';
				const users = userFactory.buildListWithId(2, { firstName, lastName });

				userRepo.findUserBySchoolAndName.mockResolvedValue(users);

				return {
					firstName,
					lastName,
					users,
				};
			};

			it('should return a list of users', async () => {
				const { firstName, lastName, users } = setup();

				const result = await service.findUserBySchoolAndName(new ObjectId().toHexString(), firstName, lastName);

				expect(result).toEqual(users);
			});
		});
	});

	describe('findMultipleByExternalIds', () => {
		describe('when a users with external id exist', () => {
			const setup = () => {
				const userA = userFactory.buildWithId({ externalId: '111' });
				const userB = userFactory.buildWithId({ externalId: '222' });

				const externalIds = ['111', '222'];
				const expectedResult = [userA.id, userB.id];

				userRepo.findByExternalIds.mockResolvedValue(expectedResult);

				return {
					expectedResult,
					externalIds,
				};
			};

			it('should call userRepo.findByExternalIds', async () => {
				const { externalIds } = setup();

				await service.findMultipleByExternalIds(externalIds);

				expect(userRepo.findByExternalIds).toBeCalledWith(externalIds);
			});

			it('should return array with Users id', async () => {
				const { externalIds, expectedResult } = setup();

				const result = await service.findMultipleByExternalIds(externalIds);
				expect(result).toEqual(expectedResult);
			});
		});

		describe('when users with this external id do not exist', () => {
			it('should return empty array', async () => {
				userRepo.findByExternalIds.mockResolvedValue([]);

				const result = await service.findMultipleByExternalIds(['externalId1', 'externalId2']);

				expect(result).toHaveLength(0);
			});
		});
	});

	describe('updateLastSyncedAt', () => {
		describe('when a users with thess external id exist', () => {
			const setup = () => {
				const userA = userFactory.buildWithId({ externalId: '111' });
				const userB = userFactory.buildWithId({ externalId: '222' });

				const userIds = [userA.id, userB.id];

				return {
					userIds,
				};
			};

			it('should call userRepo.updateAllUserByLastSyncedAt', async () => {
				const { userIds } = setup();

				await service.updateLastSyncedAt(userIds);

				expect(userRepo.updateAllUserByLastSyncedAt).toBeCalledWith(userIds);
			});
		});
	});

	describe('findMultipleByExternalIds', () => {
		const setup = () => {
			const systemId = new ObjectId().toHexString();
			const userA = userFactory.buildWithId({ externalId: '111' });
			const userB = userFactory.buildWithId({ externalId: '222' });

			const externalIds = ['111', '222'];
			const foundUsers = [userA.id, userB.id];

			return {
				externalIds,
				foundUsers,
				systemId,
			};
		};

		it('should call findMultipleByExternalIds in userService with externalIds', async () => {
			const { externalIds, foundUsers } = setup();

			userRepo.findByExternalIds.mockResolvedValueOnce(foundUsers);

			await service.findMultipleByExternalIds(externalIds);

			expect(userRepo.findByExternalIds).toHaveBeenCalledWith(externalIds);
		});

		it('should return array with verified Users', async () => {
			const { externalIds, foundUsers } = setup();

			userRepo.findByExternalIds.mockResolvedValueOnce(foundUsers);

			const result = await service.findMultipleByExternalIds(externalIds);

			expect(result).toEqual(foundUsers);
		});
	});

	describe('findUnsynchronizedUserIds', () => {
		const setup = () => {
			const currentDate = new Date();
			const dateA = new Date(currentDate.getTime() - 120 * 60000);
			const dateB = new Date(currentDate.getTime() - 3600 * 60000);
			const unsyncedForMinutes = 60;
			const userA = userFactory.buildWithId({ lastSyncedAt: dateA });
			const userB = userFactory.buildWithId({ lastSyncedAt: dateB });

			const foundUsers = [userA.id, userB.id];

			return {
				foundUsers,
				unsyncedForMinutes,
			};
		};

		describe('when findUnsynchronizedUserIds is called', () => {
			it('should call findUnsynchronizedUserIds and retrun array with found users', async () => {
				const { unsyncedForMinutes, foundUsers } = setup();

				userRepo.findUnsynchronizedUserIds.mockResolvedValueOnce(foundUsers);

				const result = await service.findUnsynchronizedUserIds(unsyncedForMinutes);

				expect(result).toEqual(foundUsers);
			});

			it('should call findUnsynchronizedUserIds and return empty array', async () => {
				const { unsyncedForMinutes } = setup();

				userRepo.findUnsynchronizedUserIds.mockResolvedValueOnce([]);
				const result = await service.findUnsynchronizedUserIds(unsyncedForMinutes);

				expect(result).toEqual([]);
			});
		});
	});

	describe('findExistingUsersByIds', () => {
		describe('when users with these ids exist', () => {
			const setup = () => {
				const userIdOne = new ObjectId().toHexString();
				const userIdTwo = new ObjectId().toHexString();
				const userOne = userDoFactory.buildWithId({ id: userIdOne });
				const userTwo = userDoFactory.buildWithId({ id: userIdTwo });

				userDoRepo.findByIdOrNull.mockResolvedValueOnce(userOne);
				userDoRepo.findByIdOrNull.mockResolvedValueOnce(userTwo);

				return {
					userOne,
					userTwo,
					userIdOne,
					userIdTwo,
				};
			};

			it('should return the users as array', async () => {
				const { userOne, userTwo, userIdOne, userIdTwo } = setup();

				const result = await service.findExistingUsersByIds([userIdOne, userIdTwo]);

				expect(result).toEqual([userOne, userTwo]);
			});
		});

		describe('when a user with this id does not exist', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();

				userDoRepo.findByIdOrNull.mockResolvedValue(null);

				return { userId };
			};

			it('should return empty array', async () => {
				const { userId } = setup();

				const result = await service.findExistingUsersByIds([userId]);

				expect(result).toEqual([]);
			});
		});
	});

	describe('resolvePermissions', () => {
		const setup = () => {
			const permission = Permission.ACCOUNT_CREATE;
			const role = roleFactory.build({ permissions: [permission] });
			const user = userFactory.buildWithId({ roles: [role] });

			config.teacherStudentVisibilityIsConfigurable = true;
			config.teacherStudentVisibilityIsEnabledByDefault = false;

			return {
				user,
				permission,
			};
		};

		it('should call user.resolvePermissions with config values', () => {
			const { user, permission } = setup();
			const userSpy = jest.spyOn(user, 'resolvePermissions').mockReturnValueOnce([permission]);

			service.resolvePermissions(user);

			expect(userSpy).toHaveBeenCalledWith(true, false);
			userSpy.mockRestore();
		});

		it('should return the permissions from user.resolvePermissions', () => {
			const { user, permission } = setup();
			const userSpy = jest.spyOn(user, 'resolvePermissions').mockReturnValueOnce([permission]);

			const result = service.resolvePermissions(user);

			expect(result).toEqual([permission]);
			userSpy.mockRestore();
		});
	});
});
