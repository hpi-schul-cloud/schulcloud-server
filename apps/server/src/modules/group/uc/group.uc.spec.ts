import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { LegacySchoolDo, Page, Permission, SchoolYearEntity, SortOrder, User, UserDO } from '@shared/domain';
import {
	groupFactory,
	legacySchoolDoFactory,
	roleDtoFactory,
	schoolYearFactory,
	setupEntities,
	UserAndAccountTestFactory,
	userDoFactory,
	userFactory,
} from '@shared/testing';
import { Action, AuthorizationContext, AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { Class } from '@modules/class/domain';
import { classFactory } from '@modules/class/domain/testing/factory/class.factory';
import { LegacySchoolService, SchoolYearService } from '@modules/legacy-school';
import { RoleService } from '@modules/role';
import { RoleDto } from '@modules/role/service/dto/role.dto';
import { SystemDto, SystemService } from '@modules/system';
import { UserService } from '@modules/user';
import { Group, GroupTypes } from '../domain';
import { GroupService } from '../service';
import { ClassInfoDto, ResolvedGroupDto } from './dto';
import { ClassRootType } from './dto/class-root-type';
import { GroupUc } from './group.uc';

describe('GroupUc', () => {
	let module: TestingModule;
	let uc: GroupUc;

	let groupService: DeepMocked<GroupService>;
	let classService: DeepMocked<ClassService>;
	let systemService: DeepMocked<SystemService>;
	let userService: DeepMocked<UserService>;
	let roleService: DeepMocked<RoleService>;
	let schoolService: DeepMocked<LegacySchoolService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolYearService: DeepMocked<SchoolYearService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				GroupUc,
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
				{
					provide: ClassService,
					useValue: createMock<ClassService>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: SchoolYearService,
					useValue: createMock<SchoolYearService>(),
				},
			],
		}).compile();

		uc = module.get(GroupUc);
		groupService = module.get(GroupService);
		classService = module.get(ClassService);
		systemService = module.get(SystemService);
		userService = module.get(UserService);
		roleService = module.get(RoleService);
		schoolService = module.get(LegacySchoolService);
		authorizationService = module.get(AuthorizationService);
		schoolYearService = module.get(SchoolYearService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findClassesForSchool', () => {
		describe('when the user has no permission', () => {
			const setup = () => {
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();
				const user: User = userFactory.buildWithId();
				const error = new ForbiddenException();

				schoolService.getSchoolById.mockResolvedValue(school);
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				authorizationService.checkPermission.mockImplementation(() => {
					throw error;
				});

				return {
					user,
					error,
				};
			};

			it('should throw forbidden', async () => {
				const { user, error } = setup();

				const func = () => uc.findAllClassesForSchool(user.id, user.school.id);

				await expect(func).rejects.toThrow(error);
			});
		});

		describe('when the school has classes', () => {
			const setup = () => {
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();
				const { studentUser } = UserAndAccountTestFactory.buildStudent();
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const teacherRole: RoleDto = roleDtoFactory.buildWithId({
					id: teacherUser.roles[0].id,
					name: teacherUser.roles[0].name,
				});
				const studentRole: RoleDto = roleDtoFactory.buildWithId({
					id: studentUser.roles[0].id,
					name: studentUser.roles[0].name,
				});
				const teacherUserDo: UserDO = userDoFactory.buildWithId({
					id: teacherUser.id,
					lastName: teacherUser.lastName,
					roles: [{ id: teacherUser.roles[0].id, name: teacherUser.roles[0].name }],
				});
				const studentUserDo: UserDO = userDoFactory.buildWithId({
					id: studentUser.id,
					lastName: studentUser.lastName,
					roles: [{ id: studentUser.roles[0].id, name: studentUser.roles[0].name }],
				});
				const schoolYear: SchoolYearEntity = schoolYearFactory.buildWithId();
				const clazz: Class = classFactory.build({
					name: 'A',
					teacherIds: [teacherUser.id],
					source: 'LDAP',
					year: schoolYear.id,
				});
				const system: SystemDto = new SystemDto({
					id: new ObjectId().toHexString(),
					displayName: 'External System',
					type: 'oauth2',
				});
				const group: Group = groupFactory.build({
					name: 'B',
					users: [{ userId: teacherUser.id, roleId: teacherUser.roles[0].id }],
					externalSource: undefined,
				});
				const groupWithSystem: Group = groupFactory.build({
					name: 'C',
					externalSource: { externalId: 'externalId', systemId: system.id },
					users: [
						{ userId: teacherUser.id, roleId: teacherUser.roles[0].id },
						{ userId: studentUser.id, roleId: studentUser.roles[0].id },
					],
				});

				schoolService.getSchoolById.mockResolvedValueOnce(school);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(teacherUser);
				classService.findClassesForSchool.mockResolvedValueOnce([clazz]);
				groupService.findClassesForSchool.mockResolvedValueOnce([group, groupWithSystem]);
				systemService.findById.mockResolvedValue(system);
				userService.findById.mockImplementation((userId: string): Promise<UserDO> => {
					if (userId === teacherUser.id) {
						return Promise.resolve(teacherUserDo);
					}

					if (userId === studentUser.id) {
						return Promise.resolve(studentUserDo);
					}

					throw new Error();
				});
				roleService.findById.mockImplementation((roleId: string): Promise<RoleDto> => {
					if (roleId === teacherUser.roles[0].id) {
						return Promise.resolve(teacherRole);
					}

					if (roleId === studentUser.roles[0].id) {
						return Promise.resolve(studentRole);
					}

					throw new Error();
				});
				schoolYearService.findById.mockResolvedValue(schoolYear);

				return {
					teacherUser,
					school,
					clazz,
					group,
					groupWithSystem,
					system,
					schoolYear,
				};
			};

			it('should check the required permissions', async () => {
				const { teacherUser, school } = setup();

				await uc.findAllClassesForSchool(teacherUser.id, teacherUser.school.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith<[User, LegacySchoolDo, AuthorizationContext]>(
					teacherUser,
					school,
					{
						action: Action.read,
						requiredPermissions: [Permission.CLASS_LIST, Permission.GROUP_LIST],
					}
				);
			});

			describe('when no pagination is given', () => {
				it('should return all classes sorted by name', async () => {
					const { teacherUser, clazz, group, groupWithSystem, system, schoolYear } = setup();

					const result: Page<ClassInfoDto> = await uc.findAllClassesForSchool(teacherUser.id, teacherUser.school.id);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [
							{
								id: clazz.id,
								name: clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name,
								type: ClassRootType.CLASS,
								externalSourceName: clazz.source,
								teachers: [teacherUser.lastName],
								schoolYear: schoolYear.name,
								isUpgradable: false,
							},
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teachers: [teacherUser.lastName],
							},
							{
								id: groupWithSystem.id,
								name: groupWithSystem.name,
								type: ClassRootType.GROUP,
								externalSourceName: system.displayName,
								teachers: [teacherUser.lastName],
							},
						],
						total: 3,
					});
				});
			});

			describe('when sorting by external source name in descending order', () => {
				it('should return all classes sorted by external source name in descending order', async () => {
					const { teacherUser, clazz, group, groupWithSystem, system, schoolYear } = setup();

					const result: Page<ClassInfoDto> = await uc.findAllClassesForSchool(
						teacherUser.id,
						teacherUser.school.id,
						undefined,
						undefined,
						'externalSourceName',
						SortOrder.desc
					);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [
							{
								id: clazz.id,
								name: clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name,
								type: ClassRootType.CLASS,
								externalSourceName: clazz.source,
								teachers: [teacherUser.lastName],
								schoolYear: schoolYear.name,
								isUpgradable: false,
							},
							{
								id: groupWithSystem.id,
								name: groupWithSystem.name,
								type: ClassRootType.GROUP,
								externalSourceName: system.displayName,
								teachers: [teacherUser.lastName],
							},
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teachers: [teacherUser.lastName],
							},
						],
						total: 3,
					});
				});
			});

			describe('when using pagination', () => {
				it('should return the selected page', async () => {
					const { teacherUser, group } = setup();

					const result: Page<ClassInfoDto> = await uc.findAllClassesForSchool(
						teacherUser.id,
						teacherUser.school.id,
						1,
						1,
						'name',
						SortOrder.asc
					);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teachers: [teacherUser.lastName],
							},
						],
						total: 3,
					});
				});
			});
		});
	});

	describe('getGroup', () => {
		describe('when the user has no permission', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const error = new ForbiddenException();

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				authorizationService.checkPermission.mockImplementation(() => {
					throw error;
				});

				return {
					user,
					error,
				};
			};

			it('should throw forbidden', async () => {
				const { user, error } = setup();

				const func = () => uc.getGroup(user.id, 'groupId');

				await expect(func).rejects.toThrow(error);
			});
		});

		describe('when the group is not found', () => {
			const setup = () => {
				groupService.findById.mockRejectedValue(new NotFoundLoggableException(Group.name, 'id', 'groupId'));
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(teacherUser);

				return {
					teacherId: teacherUser.id,
				};
			};

			it('should throw not found', async () => {
				const { teacherId } = setup();

				const func = () => uc.getGroup(teacherId, 'groupId');

				await expect(func).rejects.toThrow(NotFoundLoggableException);
			});
		});

		describe('when the group is found', () => {
			const setup = () => {
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const { studentUser } = UserAndAccountTestFactory.buildStudent();
				const group: Group = groupFactory.build({
					users: [
						{ userId: teacherUser.id, roleId: teacherUser.roles[0].id },
						{ userId: studentUser.id, roleId: studentUser.roles[0].id },
					],
				});
				const teacherRole: RoleDto = roleDtoFactory.build({
					id: teacherUser.roles[0].id,
					name: teacherUser.roles[0].name,
				});
				const studentRole: RoleDto = roleDtoFactory.build({
					id: studentUser.roles[0].id,
					name: studentUser.roles[0].name,
				});
				const teacherUserDo: UserDO = userDoFactory.build({
					id: teacherUser.id,
					firstName: teacherUser.firstName,
					lastName: teacherUser.lastName,
					email: teacherUser.email,
					roles: [{ id: teacherUser.roles[0].id, name: teacherUser.roles[0].name }],
				});
				const studentUserDo: UserDO = userDoFactory.build({
					id: studentUser.id,
					firstName: teacherUser.firstName,
					lastName: studentUser.lastName,
					email: studentUser.email,
					roles: [{ id: studentUser.roles[0].id, name: studentUser.roles[0].name }],
				});

				groupService.findById.mockResolvedValueOnce(group);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(teacherUser);
				userService.findById.mockResolvedValueOnce(teacherUserDo);
				roleService.findById.mockResolvedValueOnce(teacherRole);
				userService.findById.mockResolvedValueOnce(studentUserDo);
				roleService.findById.mockResolvedValueOnce(studentRole);

				return {
					teacherId: teacherUser.id,
					teacherUser,
					studentUser,
					group,
					expectedExternalId: group.externalSource?.externalId as string,
					expectedSystemId: group.externalSource?.systemId as string,
				};
			};

			it('should return the resolved group', async () => {
				const { teacherId, teacherUser, studentUser, group, expectedExternalId, expectedSystemId } = setup();

				const result: ResolvedGroupDto = await uc.getGroup(teacherId, group.id);

				expect(result).toMatchObject({
					id: group.id,
					name: group.name,
					type: GroupTypes.CLASS,
					externalSource: {
						externalId: expectedExternalId,
						systemId: expectedSystemId,
					},
					users: [
						{
							user: {
								id: teacherUser.id,
								firstName: teacherUser.firstName,
								lastName: teacherUser.lastName,
								email: teacherUser.email,
							},
							role: {
								id: teacherUser.roles[0].id,
								name: teacherUser.roles[0].name,
							},
						},
						{
							user: {
								id: studentUser.id,
								firstName: studentUser.firstName,
								lastName: studentUser.lastName,
								email: studentUser.email,
							},
							role: {
								id: studentUser.roles[0].id,
								name: studentUser.roles[0].name,
							},
						},
					],
				});
			});
		});
	});
});
