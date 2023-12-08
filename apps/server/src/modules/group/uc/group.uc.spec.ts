import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Action, AuthorizationContext, AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { Class } from '@modules/class/domain';
import { classFactory } from '@modules/class/domain/testing/factory/class.factory';
import { LegacySchoolService, SchoolYearService } from '@modules/legacy-school';
import { RoleService } from '@modules/role';
import { RoleDto } from '@modules/role/service/dto/role.dto';
import { LegacySystemService, SystemDto } from '@modules/system';
import { UserService } from '@modules/user';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReferencedEntityNotFoundLoggable } from '@shared/common/loggable';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { LegacySchoolDo, Page, UserDO } from '@shared/domain/domainobject';
import { SchoolYearEntity, User } from '@shared/domain/entity';
import { Permission, SortOrder } from '@shared/domain/interface';
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
import { Logger } from '@src/core/logger';
import { SchoolYearQueryType } from '../controller/dto/interface';
import { Group, GroupTypes } from '../domain';
import { UnknownQueryTypeLoggableException } from '../loggable';
import { GroupService } from '../service';
import { ClassInfoDto, ResolvedGroupDto } from './dto';
import { ClassRootType } from './dto/class-root-type';
import { GroupUc } from './group.uc';

describe('GroupUc', () => {
	let module: TestingModule;
	let uc: GroupUc;

	let groupService: DeepMocked<GroupService>;
	let classService: DeepMocked<ClassService>;
	let systemService: DeepMocked<LegacySystemService>;
	let userService: DeepMocked<UserService>;
	let roleService: DeepMocked<RoleService>;
	let schoolService: DeepMocked<LegacySchoolService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolYearService: DeepMocked<SchoolYearService>;
	let logger: DeepMocked<Logger>;

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
					provide: LegacySystemService,
					useValue: createMock<LegacySystemService>(),
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
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(GroupUc);
		groupService = module.get(GroupService);
		classService = module.get(ClassService);
		systemService = module.get(LegacySystemService);
		userService = module.get(UserService);
		roleService = module.get(RoleService);
		schoolService = module.get(LegacySchoolService);
		authorizationService = module.get(AuthorizationService);
		schoolYearService = module.get(SchoolYearService);
		logger = module.get(Logger);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findAllClasses', () => {
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
				authorizationService.hasAllPermissions.mockReturnValueOnce(false);

				return {
					user,
					error,
				};
			};

			it('should throw forbidden', async () => {
				const { user, error } = setup();

				const func = () => uc.findAllClasses(user.id, user.school.id);

				await expect(func).rejects.toThrow(error);
			});
		});

		describe('when accessing as a normal user', () => {
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
				const nextSchoolYear: SchoolYearEntity = schoolYearFactory.buildWithId({
					startDate: schoolYear.endDate,
				});
				const clazz: Class = classFactory.build({
					name: 'A',
					teacherIds: [teacherUser.id],
					source: 'LDAP',
					year: schoolYear.id,
				});
				const successorClass: Class = classFactory.build({
					name: 'NEW',
					teacherIds: [teacherUser.id],
					year: nextSchoolYear.id,
				});
				const classWithoutSchoolYear = classFactory.build({
					name: 'NoYear',
					teacherIds: [teacherUser.id],
					year: undefined,
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
				authorizationService.hasAllPermissions.mockReturnValueOnce(false);
				classService.findAllByUserId.mockResolvedValueOnce([clazz, successorClass, classWithoutSchoolYear]);
				groupService.findByUser.mockResolvedValueOnce([group, groupWithSystem]);
				classService.findClassesForSchool.mockResolvedValueOnce([clazz, successorClass, classWithoutSchoolYear]);
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
				userService.findByIdOrNull.mockImplementation((userId: string): Promise<UserDO> => {
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
				schoolYearService.findById.mockResolvedValueOnce(schoolYear);
				schoolYearService.findById.mockResolvedValueOnce(nextSchoolYear);
				schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);

				return {
					teacherUser,
					school,
					clazz,
					successorClass,
					classWithoutSchoolYear,
					group,
					groupWithSystem,
					system,
					schoolYear,
					nextSchoolYear,
				};
			};

			it('should check the required permissions', async () => {
				const { teacherUser, school } = setup();

				await uc.findAllClasses(teacherUser.id, teacherUser.school.id, SchoolYearQueryType.CURRENT_YEAR);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith<[User, LegacySchoolDo, AuthorizationContext]>(
					teacherUser,
					school,
					{
						action: Action.read,
						requiredPermissions: [Permission.CLASS_VIEW, Permission.GROUP_VIEW],
					}
				);
			});

			it('should check the access to the full list', async () => {
				const { teacherUser } = setup();

				await uc.findAllClasses(teacherUser.id, teacherUser.school.id);

				expect(authorizationService.hasAllPermissions).toHaveBeenCalledWith<[User, string[]]>(teacherUser, [
					Permission.CLASS_FULL_ADMIN,
					Permission.GROUP_FULL_ADMIN,
				]);
			});

			describe('when no pagination is given', () => {
				it('should return all classes sorted by name', async () => {
					const {
						teacherUser,
						clazz,
						successorClass,
						classWithoutSchoolYear,
						group,
						groupWithSystem,
						system,
						schoolYear,
						nextSchoolYear,
					} = setup();

					const result: Page<ClassInfoDto> = await uc.findAllClasses(teacherUser.id, teacherUser.school.id, undefined);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [
							{
								id: clazz.id,
								name: clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name,
								type: ClassRootType.CLASS,
								externalSourceName: clazz.source,
								teacherNames: [teacherUser.lastName],
								schoolYear: schoolYear.name,
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: successorClass.id,
								name: successorClass.gradeLevel
									? `${successorClass.gradeLevel}${successorClass.name}`
									: successorClass.name,
								type: ClassRootType.CLASS,
								externalSourceName: successorClass.source,
								teacherNames: [teacherUser.lastName],
								schoolYear: nextSchoolYear.name,
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: classWithoutSchoolYear.id,
								name: classWithoutSchoolYear.gradeLevel
									? `${classWithoutSchoolYear.gradeLevel}${classWithoutSchoolYear.name}`
									: classWithoutSchoolYear.name,
								type: ClassRootType.CLASS,
								externalSourceName: classWithoutSchoolYear.source,
								teacherNames: [teacherUser.lastName],
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teacherNames: [teacherUser.lastName],
								studentCount: 0,
							},
							{
								id: groupWithSystem.id,
								name: groupWithSystem.name,
								type: ClassRootType.GROUP,
								externalSourceName: system.displayName,
								teacherNames: [teacherUser.lastName],
								studentCount: 1,
							},
						],
						total: 5,
					});
				});
			});

			describe('when sorting by external source name in descending order', () => {
				it('should return all classes sorted by external source name in descending order', async () => {
					const { teacherUser, clazz, classWithoutSchoolYear, group, groupWithSystem, system, schoolYear } = setup();

					const result: Page<ClassInfoDto> = await uc.findAllClasses(
						teacherUser.id,
						teacherUser.school.id,
						SchoolYearQueryType.CURRENT_YEAR,
						undefined,
						undefined,
						'externalSourceName',
						SortOrder.desc
					);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [
							{
								id: classWithoutSchoolYear.id,
								name: classWithoutSchoolYear.gradeLevel
									? `${classWithoutSchoolYear.gradeLevel}${classWithoutSchoolYear.name}`
									: classWithoutSchoolYear.name,
								type: ClassRootType.CLASS,
								externalSourceName: classWithoutSchoolYear.source,
								teacherNames: [teacherUser.lastName],
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: clazz.id,
								name: clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name,
								type: ClassRootType.CLASS,
								externalSourceName: clazz.source,
								teacherNames: [teacherUser.lastName],
								schoolYear: schoolYear.name,
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: groupWithSystem.id,
								name: groupWithSystem.name,
								type: ClassRootType.GROUP,
								externalSourceName: system.displayName,
								teacherNames: [teacherUser.lastName],
								studentCount: 1,
							},
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teacherNames: [teacherUser.lastName],
								studentCount: 0,
							},
						],
						total: 4,
					});
				});
			});

			describe('when using pagination', () => {
				it('should return the selected page', async () => {
					const { teacherUser, group } = setup();

					const result: Page<ClassInfoDto> = await uc.findAllClasses(
						teacherUser.id,
						teacherUser.school.id,
						SchoolYearQueryType.CURRENT_YEAR,
						2,
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
								teacherNames: [teacherUser.lastName],
								studentCount: 0,
							},
						],
						total: 4,
					});
				});
			});

			describe('when querying for classes from next school year', () => {
				it('should only return classes from next school year', async () => {
					const { teacherUser, successorClass, nextSchoolYear } = setup();

					const result: Page<ClassInfoDto> = await uc.findAllClasses(
						teacherUser.id,
						teacherUser.school.id,
						SchoolYearQueryType.NEXT_YEAR
					);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [
							{
								id: successorClass.id,
								name: successorClass.gradeLevel
									? `${successorClass.gradeLevel}${successorClass.name}`
									: successorClass.name,
								externalSourceName: successorClass.source,
								type: ClassRootType.CLASS,
								teacherNames: [teacherUser.lastName],
								schoolYear: nextSchoolYear.name,
								isUpgradable: false,
								studentCount: 2,
							},
						],
						total: 1,
					});
				});
			});

			describe('when querying for archived classes', () => {
				it('should only return classes from previous school years', async () => {
					const { teacherUser } = setup();

					const result: Page<ClassInfoDto> = await uc.findAllClasses(
						teacherUser.id,
						teacherUser.school.id,
						SchoolYearQueryType.PREVIOUS_YEARS
					);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [],
						total: 0,
					});
				});
			});

			describe('when querying for not existing type', () => {
				it('should throw', async () => {
					const { teacherUser } = setup();

					const func = async () =>
						uc.findAllClasses(teacherUser.id, teacherUser.school.id, 'notAType' as SchoolYearQueryType);

					await expect(func).rejects.toThrow(UnknownQueryTypeLoggableException);
				});
			});
		});

		describe('when accessing as a user with elevated permission', () => {
			const setup = () => {
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();
				const { studentUser } = UserAndAccountTestFactory.buildStudent();
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const { adminUser } = UserAndAccountTestFactory.buildAdmin();
				const teacherRole: RoleDto = roleDtoFactory.buildWithId({
					id: teacherUser.roles[0].id,
					name: teacherUser.roles[0].name,
				});
				const studentRole: RoleDto = roleDtoFactory.buildWithId({
					id: studentUser.roles[0].id,
					name: studentUser.roles[0].name,
				});
				const adminUserDo: UserDO = userDoFactory.buildWithId({
					id: adminUser.id,
					lastName: adminUser.lastName,
					roles: [{ id: adminUser.roles[0].id, name: adminUser.roles[0].name }],
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
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(adminUser);
				authorizationService.hasAllPermissions.mockReturnValueOnce(true);
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

					if (userId === adminUser.id) {
						return Promise.resolve(adminUserDo);
					}

					throw new Error();
				});
				userService.findByIdOrNull.mockImplementation((userId: string): Promise<UserDO> => {
					if (userId === teacherUser.id) {
						return Promise.resolve(teacherUserDo);
					}

					if (userId === studentUser.id) {
						return Promise.resolve(studentUserDo);
					}

					if (userId === adminUser.id) {
						return Promise.resolve(adminUserDo);
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
					adminUser,
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
				const { adminUser, school } = setup();

				await uc.findAllClasses(adminUser.id, adminUser.school.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith<[User, LegacySchoolDo, AuthorizationContext]>(
					adminUser,
					school,
					{
						action: Action.read,
						requiredPermissions: [Permission.CLASS_VIEW, Permission.GROUP_VIEW],
					}
				);
			});

			it('should check the access to the full list', async () => {
				const { adminUser } = setup();

				await uc.findAllClasses(adminUser.id, adminUser.school.id);

				expect(authorizationService.hasAllPermissions).toHaveBeenCalledWith<[User, string[]]>(adminUser, [
					Permission.CLASS_FULL_ADMIN,
					Permission.GROUP_FULL_ADMIN,
				]);
			});

			describe('when no pagination is given', () => {
				it('should return all classes sorted by name', async () => {
					const { adminUser, teacherUser, clazz, group, groupWithSystem, system, schoolYear } = setup();

					const result: Page<ClassInfoDto> = await uc.findAllClasses(adminUser.id, adminUser.school.id);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [
							{
								id: clazz.id,
								name: clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name,
								type: ClassRootType.CLASS,
								externalSourceName: clazz.source,
								teacherNames: [teacherUser.lastName],
								schoolYear: schoolYear.name,
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teacherNames: [teacherUser.lastName],
								studentCount: 0,
							},
							{
								id: groupWithSystem.id,
								name: groupWithSystem.name,
								type: ClassRootType.GROUP,
								externalSourceName: system.displayName,
								teacherNames: [teacherUser.lastName],
								studentCount: 1,
							},
						],
						total: 3,
					});
				});
			});

			describe('when sorting by external source name in descending order', () => {
				it('should return all classes sorted by external source name in descending order', async () => {
					const { adminUser, teacherUser, clazz, group, groupWithSystem, system, schoolYear } = setup();

					const result: Page<ClassInfoDto> = await uc.findAllClasses(
						adminUser.id,
						adminUser.school.id,
						undefined,
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
								teacherNames: [teacherUser.lastName],
								schoolYear: schoolYear.name,
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: groupWithSystem.id,
								name: groupWithSystem.name,
								type: ClassRootType.GROUP,
								externalSourceName: system.displayName,
								teacherNames: [teacherUser.lastName],
								studentCount: 1,
							},
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teacherNames: [teacherUser.lastName],
								studentCount: 0,
							},
						],
						total: 3,
					});
				});
			});

			describe('when using pagination', () => {
				it('should return the selected page', async () => {
					const { adminUser, teacherUser, group } = setup();

					const result: Page<ClassInfoDto> = await uc.findAllClasses(
						adminUser.id,
						adminUser.school.id,
						undefined,
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
								teacherNames: [teacherUser.lastName],
								studentCount: 0,
							},
						],
						total: 3,
					});
				});
			});
		});

		describe('when class has a user referenced which is not existing', () => {
			const setup = () => {
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();
				const notFoundReferenceId = new ObjectId().toHexString();
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const teacherRole: RoleDto = roleDtoFactory.buildWithId({
					id: teacherUser.roles[0].id,
					name: teacherUser.roles[0].name,
				});

				const teacherUserDo: UserDO = userDoFactory.buildWithId({
					id: teacherUser.id,
					lastName: teacherUser.lastName,
					roles: [{ id: teacherUser.roles[0].id, name: teacherUser.roles[0].name }],
				});

				const schoolYear: SchoolYearEntity = schoolYearFactory.buildWithId();
				const clazz: Class = classFactory.build({
					name: 'A',
					teacherIds: [teacherUser.id, notFoundReferenceId],
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
					users: [
						{ userId: teacherUser.id, roleId: teacherUser.roles[0].id },
						{ userId: notFoundReferenceId, roleId: teacherUser.roles[0].id },
					],
					externalSource: undefined,
				});

				schoolService.getSchoolById.mockResolvedValueOnce(school);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(teacherUser);
				authorizationService.hasAllPermissions.mockReturnValueOnce(false);
				classService.findAllByUserId.mockResolvedValueOnce([clazz]);
				groupService.findByUser.mockResolvedValueOnce([group]);
				systemService.findById.mockResolvedValue(system);

				userService.findById.mockImplementation((userId: string): Promise<UserDO> => {
					if (userId === teacherUser.id) {
						return Promise.resolve(teacherUserDo);
					}

					throw new Error();
				});
				userService.findByIdOrNull.mockImplementation((userId: string): Promise<UserDO | null> => {
					if (userId === teacherUser.id) {
						return Promise.resolve(teacherUserDo);
					}

					if (userId === notFoundReferenceId) {
						return Promise.resolve(null);
					}

					throw new Error();
				});
				roleService.findById.mockImplementation((roleId: string): Promise<RoleDto> => {
					if (roleId === teacherUser.roles[0].id) {
						return Promise.resolve(teacherRole);
					}

					throw new Error();
				});
				schoolYearService.findById.mockResolvedValue(schoolYear);

				return {
					teacherUser,
					clazz,
					group,
					notFoundReferenceId,
					schoolYear,
				};
			};

			it('should return class without missing user', async () => {
				const { teacherUser, clazz, group, schoolYear } = setup();

				const result = await uc.findAllClasses(teacherUser.id, teacherUser.school.id);

				expect(result).toEqual<Page<ClassInfoDto>>({
					data: [
						{
							id: clazz.id,
							name: clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name,
							type: ClassRootType.CLASS,
							externalSourceName: clazz.source,
							teacherNames: [teacherUser.lastName],
							schoolYear: schoolYear.name,
							isUpgradable: false,
							studentCount: 2,
						},
						{
							id: group.id,
							name: group.name,
							type: ClassRootType.GROUP,
							teacherNames: [teacherUser.lastName],
							studentCount: 0,
						},
					],
					total: 2,
				});
			});

			it('should log the missing user', async () => {
				const { teacherUser, clazz, group, notFoundReferenceId } = setup();

				await uc.findAllClasses(teacherUser.id, teacherUser.school.id);

				expect(logger.warning).toHaveBeenCalledWith(
					new ReferencedEntityNotFoundLoggable(Class.name, clazz.id, UserDO.name, notFoundReferenceId)
				);
				expect(logger.warning).toHaveBeenCalledWith(
					new ReferencedEntityNotFoundLoggable(Group.name, group.id, UserDO.name, notFoundReferenceId)
				);
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
				groupService.findById.mockRejectedValue(new NotFoundLoggableException(Group.name, { id: 'groupId' }));
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
				userService.findByIdOrNull.mockResolvedValueOnce(teacherUserDo);
				roleService.findById.mockResolvedValueOnce(teacherRole);
				userService.findById.mockResolvedValueOnce(studentUserDo);
				userService.findByIdOrNull.mockResolvedValueOnce(studentUserDo);
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
