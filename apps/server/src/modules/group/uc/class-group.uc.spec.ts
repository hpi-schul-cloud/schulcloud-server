import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	Action,
	AuthorizationContext,
	AuthorizationContextBuilder,
	AuthorizationService,
} from '@modules/authorization';
import { ClassService } from '@modules/class';
import { Class } from '@modules/class/domain';
import { classFactory } from '@modules/class/domain/testing/factory/class.factory';
import { CourseDoService } from '@modules/course';
import { courseFactory } from '@modules/course/testing';
import { ClassGroupUc } from '@modules/group/uc/class-group.uc';
import { ProvisioningConfig } from '@modules/provisioning';
import { RoleService } from '@modules/role';
import { RoleDto } from '@modules/role/service/dto/role.dto';
import { roleDtoFactory } from '@modules/role/testing';
import { School, SchoolService, SchoolYearService } from '@modules/school/domain';
import { schoolFactory, schoolYearDoFactory, schoolYearEntityFactory } from '@modules/school/testing';
import { SystemService } from '@modules/system';
import { systemFactory } from '@modules/system/testing';
import { UserDo, UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userDoFactory, userFactory } from '@modules/user/testing';
import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { Permission, SortOrder } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { SchoolYearQueryType } from '../controller/dto/interface';
import { Group, GroupFilter, GroupTypes } from '../domain';
import { UnknownQueryTypeLoggableException } from '../loggable';
import { GroupService } from '../service';
import { groupFactory } from '../testing';
import { ClassInfoDto } from './dto';
import { ClassRootType } from './dto/class-root-type';

describe('ClassGroupUc', () => {
	let module: TestingModule;
	let uc: ClassGroupUc;

	let groupService: DeepMocked<GroupService>;
	let userService: DeepMocked<UserService>;
	let roleService: DeepMocked<RoleService>;
	let classService: DeepMocked<ClassService>;
	let systemService: DeepMocked<SystemService>;
	let schoolService: DeepMocked<SchoolService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolYearService: DeepMocked<SchoolYearService>;
	let courseService: DeepMocked<CourseDoService>;
	let configService: DeepMocked<ConfigService<ProvisioningConfig, true>>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ClassGroupUc,
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
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
					provide: ClassService,
					useValue: createMock<ClassService>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
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
					provide: CourseDoService,
					useValue: createMock<CourseDoService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		uc = module.get(ClassGroupUc);
		groupService = module.get(GroupService);
		userService = module.get(UserService);
		roleService = module.get(RoleService);
		classService = module.get(ClassService);
		systemService = module.get(SystemService);
		schoolService = module.get(SchoolService);
		authorizationService = module.get(AuthorizationService);
		schoolYearService = module.get(SchoolYearService);
		courseService = module.get(CourseDoService);
		configService = module.get(ConfigService);

		await setupEntities([User]);
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
				const school = schoolFactory.build();
				const user = userFactory.buildWithId();
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
				const schoolYearDo = schoolYearDoFactory.build();
				const school = schoolFactory.build({
					currentYear: schoolYearDo,
				});

				const { studentUser } = UserAndAccountTestFactory.buildStudent();
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const teacherRole = roleDtoFactory.buildWithId({
					id: teacherUser.roles[0].id,
					name: teacherUser.roles[0].name,
				});
				const studentRole = roleDtoFactory.buildWithId({
					id: studentUser.roles[0].id,
					name: studentUser.roles[0].name,
				});
				const teacherUserDo = userDoFactory.buildWithId({
					id: teacherUser.id,
					lastName: teacherUser.lastName,
					roles: [{ id: teacherUser.roles[0].id, name: teacherUser.roles[0].name }],
				});
				const studentUserDo = userDoFactory.buildWithId({
					id: studentUser.id,
					lastName: studentUser.lastName,
					roles: [{ id: studentUser.roles[0].id, name: studentUser.roles[0].name }],
				});

				const { startDate } = schoolYearDo.getProps();
				const schoolYear = schoolYearEntityFactory.buildWithId({ startDate });
				const nextSchoolYear = schoolYearEntityFactory.buildWithId({
					startDate: schoolYear.endDate,
				});

				const clazz = classFactory.build({
					name: 'A',
					teacherIds: [teacherUser.id],
					source: 'LDAP',
					year: schoolYear.id,
				});
				const successorClass = classFactory.build({
					name: 'NEW',
					teacherIds: [teacherUser.id],
					year: nextSchoolYear.id,
				});
				const classWithoutSchoolYear = classFactory.build({
					name: 'NoYear',
					teacherIds: [teacherUser.id],
					year: undefined,
				});

				const system = systemFactory.withOauthConfig().build({
					displayName: 'External System',
				});
				const group = groupFactory.build({
					name: 'B',
					users: [{ userId: teacherUser.id, roleId: teacherUser.roles[0].id }],
					externalSource: undefined,
				});
				const groupWithSystem = groupFactory.build({
					name: 'C',
					externalSource: { externalId: 'externalId', systemId: system.id },
					users: [
						{ userId: teacherUser.id, roleId: teacherUser.roles[0].id },
						{ userId: studentUser.id, roleId: studentUser.roles[0].id },
					],
				});
				const synchronizedCourse = courseFactory.build({ syncedWithGroup: group.id });

				schoolService.getSchoolById.mockResolvedValueOnce(school);
				schoolService.getCurrentYear.mockResolvedValueOnce(schoolYearDo);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(teacherUser);
				authorizationService.hasAllPermissions.mockReturnValueOnce(false);
				authorizationService.hasPermission.mockReturnValueOnce(false);
				classService.findAllByUserId.mockResolvedValueOnce([clazz, successorClass, classWithoutSchoolYear]);
				groupService.findGroups.mockResolvedValueOnce(new Page<Group>([group, groupWithSystem], 2));
				classService.findClassesForSchool.mockResolvedValueOnce([clazz, successorClass, classWithoutSchoolYear]);
				groupService.findGroups.mockResolvedValueOnce(new Page<Group>([group, groupWithSystem], 2));
				systemService.findById.mockResolvedValue(system);
				userService.findById.mockImplementation((userId: string): Promise<UserDo> => {
					if (userId === teacherUser.id) {
						return Promise.resolve(teacherUserDo);
					}

					if (userId === studentUser.id) {
						return Promise.resolve(studentUserDo);
					}

					throw new Error();
				});
				userService.findByIdOrNull.mockImplementation((userId: string): Promise<UserDo> => {
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
				configService.get.mockReturnValueOnce(true);
				courseService.findBySyncedGroup.mockResolvedValueOnce([synchronizedCourse]);
				courseService.findBySyncedGroup.mockResolvedValueOnce([]);

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
					synchronizedCourse,
				};
			};

			it('should check the required permissions', async () => {
				const { teacherUser, school } = setup();

				await uc.findAllClasses(teacherUser.id, teacherUser.school.id, SchoolYearQueryType.CURRENT_YEAR);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith<[User, School, AuthorizationContext]>(
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
						synchronizedCourse,
					} = setup();

					const result = await uc.findAllClasses(teacherUser.id, teacherUser.school.id, undefined);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [
							{
								id: clazz.id,
								name: clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name,
								type: ClassRootType.CLASS,
								externalSourceName: clazz.source,
								teacherNames: [],
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
								teacherNames: [],
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
								teacherNames: [],
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teacherNames: [],
								studentCount: 0,
								synchronizedCourses: [{ id: synchronizedCourse.id, name: synchronizedCourse.name }],
							},
							{
								id: groupWithSystem.id,
								name: groupWithSystem.name,
								type: ClassRootType.GROUP,
								externalSourceName: system.displayName,
								teacherNames: [],
								studentCount: 0,
								synchronizedCourses: [],
							},
						],
						total: 5,
					});
				});

				it('should call group service with userId, group type class and no pagination', async () => {
					const { teacherUser } = setup();

					await uc.findAllClasses(teacherUser.id, teacherUser.school.id);

					expect(groupService.findGroups).toHaveBeenCalledWith<[GroupFilter]>({
						userId: teacherUser.id,
						groupTypes: [GroupTypes.CLASS, GroupTypes.COURSE, GroupTypes.OTHER],
					});
				});
			});

			describe('when sorting by external source name in descending order', () => {
				it('should return all classes sorted by external source name in descending order', async () => {
					const {
						teacherUser,
						clazz,
						classWithoutSchoolYear,
						group,
						groupWithSystem,
						system,
						schoolYear,
						synchronizedCourse,
					} = setup();

					const result = await uc.findAllClasses(
						teacherUser.id,
						teacherUser.school.id,
						SchoolYearQueryType.CURRENT_YEAR,
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
								teacherNames: [],
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: clazz.id,
								name: clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name,
								type: ClassRootType.CLASS,
								externalSourceName: clazz.source,
								teacherNames: [],
								schoolYear: schoolYear.name,
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: groupWithSystem.id,
								name: groupWithSystem.name,
								type: ClassRootType.GROUP,
								externalSourceName: system.displayName,
								teacherNames: [],
								studentCount: 0,
								synchronizedCourses: [],
							},
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teacherNames: [],
								studentCount: 0,
								synchronizedCourses: [{ id: synchronizedCourse.id, name: synchronizedCourse.name }],
							},
						],
						total: 4,
					});
				});
			});

			describe('when using pagination', () => {
				it('should return the selected page', async () => {
					const { teacherUser, group, synchronizedCourse } = setup();

					const result = await uc.findAllClasses(
						teacherUser.id,
						teacherUser.school.id,
						SchoolYearQueryType.CURRENT_YEAR,
						{ skip: 2, limit: 1 },
						'name',
						SortOrder.asc
					);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teacherNames: [],
								studentCount: 0,
								synchronizedCourses: [{ id: synchronizedCourse.id, name: synchronizedCourse.name }],
							},
						],
						total: 4,
					});
				});
			});

			describe('when querying for classes from next school year', () => {
				it('should only return classes from next school year', async () => {
					const { teacherUser, successorClass, nextSchoolYear } = setup();

					const result = await uc.findAllClasses(teacherUser.id, teacherUser.school.id, SchoolYearQueryType.NEXT_YEAR);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [
							{
								id: successorClass.id,
								name: successorClass.gradeLevel
									? `${successorClass.gradeLevel}${successorClass.name}`
									: successorClass.name,
								externalSourceName: successorClass.source,
								type: ClassRootType.CLASS,
								teacherNames: [],
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

					const result = await uc.findAllClasses(
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

		describe('when accessing as an admin', () => {
			const setup = (generateClasses = false) => {
				const school = schoolFactory.build();
				const { studentUser } = UserAndAccountTestFactory.buildStudent();
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const { adminUser } = UserAndAccountTestFactory.buildAdmin();
				const teacherRole = roleDtoFactory.buildWithId({
					id: teacherUser.roles[0].id,
					name: teacherUser.roles[0].name,
				});
				const studentRole = roleDtoFactory.buildWithId({
					id: studentUser.roles[0].id,
					name: studentUser.roles[0].name,
				});
				const adminUserDo = userDoFactory.buildWithId({
					id: adminUser.id,
					lastName: adminUser.lastName,
					roles: [{ id: adminUser.roles[0].id, name: adminUser.roles[0].name }],
				});
				const teacherUserDo = userDoFactory.buildWithId({
					id: teacherUser.id,
					lastName: teacherUser.lastName,
					roles: [{ id: teacherUser.roles[0].id, name: teacherUser.roles[0].name }],
				});
				const studentUserDo = userDoFactory.buildWithId({
					id: studentUser.id,
					lastName: studentUser.lastName,
					roles: [{ id: studentUser.roles[0].id, name: studentUser.roles[0].name }],
				});
				const schoolYear = schoolYearEntityFactory.buildWithId();
				let clazzes: Class[] = [];
				if (generateClasses) {
					clazzes = classFactory.buildList(11, {
						name: 'A',
						teacherIds: [teacherUser.id],
						source: 'LDAP',
						year: schoolYear.id,
					});
				}
				const clazz = classFactory.build({
					name: 'A',
					teacherIds: [teacherUser.id],
					source: 'LDAP',
					year: schoolYear.id,
				});
				const system = systemFactory.withOauthConfig().build({
					displayName: 'External System',
				});
				const group = groupFactory.build({
					name: 'B',
					users: [{ userId: teacherUser.id, roleId: teacherUser.roles[0].id }],
					externalSource: undefined,
				});
				const groupWithSystem = groupFactory.build({
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
				authorizationService.hasPermission.mockReturnValueOnce(false);
				classService.findClassesForSchool.mockResolvedValueOnce([...clazzes, clazz]);
				groupService.findGroups.mockResolvedValueOnce(new Page<Group>([group, groupWithSystem], 2));
				systemService.findById.mockResolvedValue(system);

				userService.findById.mockImplementation((userId: string): Promise<UserDo> => {
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
				userService.findByIdOrNull.mockImplementation((userId: string): Promise<UserDo> => {
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
				configService.get.mockReturnValueOnce(true);
				courseService.findBySyncedGroup.mockResolvedValueOnce([]);
				courseService.findBySyncedGroup.mockResolvedValueOnce([]);

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

				expect(authorizationService.checkPermission).toHaveBeenCalledWith<[User, School, AuthorizationContext]>(
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
					const { adminUser, clazz, group, groupWithSystem, system, schoolYear } = setup();

					const result = await uc.findAllClasses(adminUser.id, adminUser.school.id);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [
							{
								id: clazz.id,
								name: clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name,
								type: ClassRootType.CLASS,
								externalSourceName: clazz.source,
								teacherNames: [],
								schoolYear: schoolYear.name,
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teacherNames: [],
								studentCount: 0,
								synchronizedCourses: [],
							},
							{
								id: groupWithSystem.id,
								name: groupWithSystem.name,
								type: ClassRootType.GROUP,
								externalSourceName: system.displayName,
								teacherNames: [],
								studentCount: 0,
								synchronizedCourses: [],
							},
						],
						total: 3,
					});
				});

				it('should call group service with schoolId, group type class and no pagination', async () => {
					const { teacherUser } = setup();

					await uc.findAllClasses(teacherUser.id, teacherUser.school.id);

					expect(groupService.findGroups).toHaveBeenCalledWith<[GroupFilter]>({
						schoolId: teacherUser.school.id,
						groupTypes: [GroupTypes.CLASS, GroupTypes.COURSE, GroupTypes.OTHER],
					});
				});
			});

			describe('when sorting by external source name in descending order', () => {
				it('should return all classes sorted by external source name in descending order', async () => {
					const { adminUser, clazz, group, groupWithSystem, system, schoolYear } = setup();

					const result = await uc.findAllClasses(
						adminUser.id,
						adminUser.school.id,
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
								teacherNames: [],
								schoolYear: schoolYear.name,
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: groupWithSystem.id,
								name: groupWithSystem.name,
								type: ClassRootType.GROUP,
								externalSourceName: system.displayName,
								teacherNames: [],
								studentCount: 0,
								synchronizedCourses: [],
							},
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teacherNames: [],
								studentCount: 0,
								synchronizedCourses: [],
							},
						],
						total: 3,
					});
				});
			});

			describe('when using pagination', () => {
				it('should return the selected page', async () => {
					const { adminUser, group } = setup();

					const result = await uc.findAllClasses(
						adminUser.id,
						adminUser.school.id,
						undefined,
						{ skip: 1, limit: 1 },
						'name',
						SortOrder.asc
					);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teacherNames: [],
								studentCount: 0,
								synchronizedCourses: [],
							},
						],
						total: 3,
					});
				});

				it('should return classes with expected limit', async () => {
					const { adminUser } = setup(true);

					const result = await uc.findAllClasses(adminUser.id, adminUser.school.id, undefined, {
						skip: 0,
						limit: 5,
					});

					expect(result.data.length).toEqual(5);
				});

				it('should return all classes without limit', async () => {
					const { adminUser } = setup(true);

					const result = await uc.findAllClasses(adminUser.id, adminUser.school.id, undefined, {
						skip: 0,
						limit: -1,
					});

					expect(result.data.length).toEqual(14);
				});
			});
		});

		describe('when accessing as a teacher with elevated rights', () => {
			const setup = (generateClasses = false) => {
				const school = schoolFactory.build();
				const { studentUser } = UserAndAccountTestFactory.buildStudent();
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const { adminUser } = UserAndAccountTestFactory.buildAdmin();
				const teacherRole = roleDtoFactory.buildWithId({
					id: teacherUser.roles[0].id,
					name: teacherUser.roles[0].name,
				});
				const studentRole = roleDtoFactory.buildWithId({
					id: studentUser.roles[0].id,
					name: studentUser.roles[0].name,
				});
				const adminUserDo = userDoFactory.buildWithId({
					id: adminUser.id,
					lastName: adminUser.lastName,
					roles: [{ id: adminUser.roles[0].id, name: adminUser.roles[0].name }],
				});
				const teacherUserDo = userDoFactory.buildWithId({
					id: teacherUser.id,
					lastName: teacherUser.lastName,
					roles: [{ id: teacherUser.roles[0].id, name: teacherUser.roles[0].name }],
				});
				const studentUserDo = userDoFactory.buildWithId({
					id: studentUser.id,
					lastName: studentUser.lastName,
					roles: [{ id: studentUser.roles[0].id, name: studentUser.roles[0].name }],
				});
				const schoolYear = schoolYearEntityFactory.buildWithId();
				let clazzes: Class[] = [];
				if (generateClasses) {
					clazzes = classFactory.buildList(11, {
						name: 'A',
						teacherIds: [teacherUser.id],
						source: 'LDAP',
						year: schoolYear.id,
					});
				}
				const clazz = classFactory.build({
					name: 'A',
					teacherIds: [teacherUser.id],
					source: 'LDAP',
					year: schoolYear.id,
				});
				const system = systemFactory.withOauthConfig().build({
					displayName: 'External System',
				});
				const group = groupFactory.build({
					name: 'B',
					users: [{ userId: teacherUser.id, roleId: teacherUser.roles[0].id }],
					externalSource: undefined,
				});
				const groupWithSystem = groupFactory.build({
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
				authorizationService.hasPermission.mockReturnValueOnce(true);
				classService.findClassesForSchool.mockResolvedValueOnce([...clazzes, clazz]);
				groupService.findGroups.mockResolvedValueOnce(new Page<Group>([group, groupWithSystem], 2));
				systemService.findById.mockResolvedValue(system);

				userService.findById.mockImplementation((userId: string): Promise<UserDo> => {
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
				userService.findByIdOrNull.mockImplementation((userId: string): Promise<UserDo> => {
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
				configService.get.mockReturnValueOnce(true);
				courseService.findBySyncedGroup.mockResolvedValueOnce([]);
				courseService.findBySyncedGroup.mockResolvedValueOnce([]);

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
				const { teacherUser, school } = setup();

				await uc.findAllClasses(teacherUser.id, teacherUser.school.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith<[User, School, AuthorizationContext]>(
					teacherUser,
					school,
					{
						action: Action.read,
						requiredPermissions: [Permission.CLASS_VIEW, Permission.GROUP_VIEW],
					}
				);
			});

			it('should check the access to the full list', async () => {
				const { teacherUser, school } = setup();

				await uc.findAllClasses(teacherUser.id, teacherUser.school.id);

				expect(authorizationService.hasPermission).toHaveBeenCalledWith<[User, School, AuthorizationContext]>(
					teacherUser,
					school,
					AuthorizationContextBuilder.read([Permission.STUDENT_LIST])
				);
			});
		});

		describe('when class has a user referenced which is not existing', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const notFoundReferenceId = new ObjectId().toHexString();
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const teacherRole = roleDtoFactory.buildWithId({
					id: teacherUser.roles[0].id,
					name: teacherUser.roles[0].name,
				});

				const teacherUserDo = userDoFactory.buildWithId({
					id: teacherUser.id,
					lastName: teacherUser.lastName,
					roles: [{ id: teacherUser.roles[0].id, name: teacherUser.roles[0].name }],
				});

				const schoolYear = schoolYearEntityFactory.buildWithId();
				const clazz = classFactory.build({
					name: 'A',
					teacherIds: [teacherUser.id, notFoundReferenceId],
					source: 'LDAP',
					year: schoolYear.id,
				});
				const system = systemFactory.withOauthConfig().build({
					displayName: 'External System',
				});
				const group = groupFactory.build({
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
				groupService.findGroups.mockResolvedValueOnce(new Page<Group>([group], 1));
				systemService.findById.mockResolvedValue(system);

				userService.findById.mockImplementation((userId: string): Promise<UserDo> => {
					if (userId === teacherUser.id) {
						return Promise.resolve(teacherUserDo);
					}

					throw new Error();
				});
				userService.findByIdOrNull.mockImplementation((userId: string): Promise<UserDo | null> => {
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
				configService.get.mockReturnValueOnce(true);
				courseService.findBySyncedGroup.mockResolvedValueOnce([]);

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
							teacherNames: [],
							schoolYear: schoolYear.name,
							isUpgradable: false,
							studentCount: 2,
						},
						{
							id: group.id,
							name: group.name,
							type: ClassRootType.GROUP,
							teacherNames: [],
							studentCount: 0,
							synchronizedCourses: [],
						},
					],
					total: 2,
				});
			});
		});
	});
});
