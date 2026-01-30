import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Action, AuthorizationContext, AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { Class } from '@modules/class/domain';
import { classFactory } from '@modules/class/domain/testing/factory/class.factory';
import { Course, CourseDoService } from '@modules/course';
import { courseFactory } from '@modules/course/testing';
import { ClassGroupUc } from '@modules/group/uc/class-group.uc';
import { RoleService } from '@modules/role';
import { roleDtoFactory } from '@modules/role/testing';
import { School, SchoolService, SchoolYearService } from '@modules/school/domain';
import { schoolFactory, schoolYearDoFactory } from '@modules/school/testing';
import { SystemService } from '@modules/system';
import { systemFactory } from '@modules/system/testing';
import { UserDo, UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { Permission, SortOrder } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { GroupConfig } from '..';
import { ClassSortQueryType, SchoolYearQueryType } from '../controller/dto/interface';
import { Group } from '../domain';
import { GROUP_CONFIG_TOKEN } from '../group.config';
import { UnknownQueryTypeLoggableException } from '../loggable';
import { GroupService } from '../service';
import { groupFactory } from '../testing';
import { ClassInfoDto, ClassRootType } from './dto';

describe('ClassGroupUc', () => {
	let module: TestingModule;
	let uc: ClassGroupUc;

	let groupService: DeepMocked<GroupService>;
	let roleService: DeepMocked<RoleService>;
	let classService: DeepMocked<ClassService>;
	let systemService: DeepMocked<SystemService>;
	let schoolService: DeepMocked<SchoolService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolYearService: DeepMocked<SchoolYearService>;
	let courseService: DeepMocked<CourseDoService>;
	let config: GroupConfig;
	let userService: DeepMocked<UserService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ClassGroupUc,
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
				{
					provide: ClassService,
					useValue: createMock<ClassService>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
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
					provide: GROUP_CONFIG_TOKEN,
					useValue: {
						featureSchulconnexCourseSyncEnabled: true,
					},
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
			],
		}).compile();

		uc = module.get(ClassGroupUc);
		groupService = module.get(GroupService);
		roleService = module.get(RoleService);
		classService = module.get(ClassService);
		systemService = module.get(SystemService);
		schoolService = module.get(SchoolService);
		authorizationService = module.get(AuthorizationService);
		schoolYearService = module.get(SchoolYearService);
		courseService = module.get(CourseDoService);
		config = module.get(GROUP_CONFIG_TOKEN);
		userService = module.get(UserService);

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
				const schoolYear = schoolYearDoFactory.build();
				const nextSchoolYear = schoolYearDoFactory.build();
				const school = schoolFactory.build({
					currentYear: schoolYear,
				});

				const { studentUser } = UserAndAccountTestFactory.buildStudent();
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const studentRole = roleDtoFactory.buildWithId({
					id: studentUser.roles[0].id,
					name: studentUser.roles[0].name,
				});
				const teacherRole = roleDtoFactory.buildWithId({
					id: teacherUser.roles[0].id,
					name: teacherUser.roles[0].name,
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
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(teacherUser);
				authorizationService.hasAllPermissions.mockReturnValueOnce(false);
				authorizationService.hasPermission.mockReturnValueOnce(false);
				schoolYearService.getAllSchoolYears.mockResolvedValueOnce([schoolYear, nextSchoolYear]);
				classService.find.mockResolvedValueOnce([clazz, successorClass, classWithoutSchoolYear]);
				groupService.findByScope.mockResolvedValueOnce(new Page<Group>([group, groupWithSystem], 2));
				systemService.getSystems.mockResolvedValueOnce([system]);
				roleService.findByName.mockResolvedValueOnce(studentRole);
				config.featureSchulconnexCourseSyncEnabled = true;
				roleService.findByName.mockResolvedValueOnce(teacherRole);
				const teacherUserDo = {
					id: teacherUser.id,
					firstName: teacherUser.firstName,
					lastName: teacherUser.lastName,
					schoolId: teacherUser.school.id,
				} as UserDo;
				userService.findByIds.mockResolvedValue([teacherUserDo]);
				courseService.findBySyncedGroup.mockImplementation((g: Group) => {
					const courses: Course[] = [];

					if (g.id === synchronizedCourse.syncedWithGroup) {
						courses.push(synchronizedCourse);
					}

					return Promise.resolve(courses);
				});

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
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
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
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
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
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
								studentCount: 0,
								synchronizedCourses: [synchronizedCourse],
							},
							{
								id: groupWithSystem.id,
								name: groupWithSystem.name,
								type: ClassRootType.GROUP,
								externalSourceName: system.displayName,
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
								studentCount: 0,
								synchronizedCourses: [],
							},
						],
						total: 5,
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
						ClassSortQueryType.EXTERNAL_SOURCE_NAME,
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
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: clazz.id,
								name: clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name,
								type: ClassRootType.CLASS,
								externalSourceName: clazz.source,
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
								schoolYear: schoolYear.name,
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: groupWithSystem.id,
								name: groupWithSystem.name,
								type: ClassRootType.GROUP,
								externalSourceName: system.displayName,
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
								studentCount: 0,
								synchronizedCourses: [],
							},
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
								studentCount: 0,
								synchronizedCourses: [synchronizedCourse],
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
						ClassSortQueryType.NAME,
						SortOrder.asc
					);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
								studentCount: 0,
								synchronizedCourses: [synchronizedCourse],
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
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
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
				const schoolYear = schoolYearDoFactory.build();
				const school = schoolFactory.build({ currentYear: schoolYear });

				const { studentUser } = UserAndAccountTestFactory.buildStudent();
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const { adminUser } = UserAndAccountTestFactory.buildAdmin();
				const studentRole = roleDtoFactory.buildWithId({
					id: studentUser.roles[0].id,
					name: studentUser.roles[0].name,
				});
				const teacherRole = roleDtoFactory.buildWithId({
					id: teacherUser.roles[0].id,
					name: teacherUser.roles[0].name,
				});

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
				schoolYearService.getAllSchoolYears.mockResolvedValueOnce([schoolYear]);
				classService.find.mockResolvedValueOnce([...clazzes, clazz]);
				groupService.findByScope.mockResolvedValueOnce(new Page<Group>([group, groupWithSystem], 2));
				systemService.getSystems.mockResolvedValueOnce([system]);
				roleService.findByName.mockResolvedValueOnce(studentRole);
				config.featureSchulconnexCourseSyncEnabled = true;
				roleService.findByName.mockResolvedValueOnce(teacherRole);
				const teacherUserDo = {
					id: teacherUser.id,
					firstName: teacherUser.firstName,
					lastName: teacherUser.lastName,
					schoolId: teacherUser.school.id,
				} as UserDo;
				userService.findByIds.mockResolvedValue([teacherUserDo]);
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
					const { adminUser, teacherUser, clazz, group, groupWithSystem, system, schoolYear } = setup();

					const result = await uc.findAllClasses(adminUser.id, adminUser.school.id);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [
							{
								id: clazz.id,
								name: clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name,
								type: ClassRootType.CLASS,
								externalSourceName: clazz.source,
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
								schoolYear: schoolYear.name,
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
								studentCount: 0,
								synchronizedCourses: [],
							},
							{
								id: groupWithSystem.id,
								name: groupWithSystem.name,
								type: ClassRootType.GROUP,
								externalSourceName: system.displayName,
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
								studentCount: 0,
								synchronizedCourses: [],
							},
						],
						total: 3,
					});
				});
			});

			describe('when sorting by external source name in descending order', () => {
				it('should return all classes sorted by external source name in descending order', async () => {
					const { adminUser, teacherUser, clazz, group, groupWithSystem, system, schoolYear } = setup();

					const result = await uc.findAllClasses(
						adminUser.id,
						adminUser.school.id,
						undefined,
						undefined,
						ClassSortQueryType.EXTERNAL_SOURCE_NAME,
						SortOrder.desc
					);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [
							{
								id: clazz.id,
								name: clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name,
								type: ClassRootType.CLASS,
								externalSourceName: clazz.source,
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
								schoolYear: schoolYear.name,
								isUpgradable: false,
								studentCount: 2,
							},
							{
								id: groupWithSystem.id,
								name: groupWithSystem.name,
								type: ClassRootType.GROUP,
								externalSourceName: system.displayName,
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
								studentCount: 0,
								synchronizedCourses: [],
							},
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
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
					const { adminUser, teacherUser, group } = setup();

					const result = await uc.findAllClasses(
						adminUser.id,
						adminUser.school.id,
						undefined,
						{ skip: 1, limit: 1 },
						ClassSortQueryType.NAME,
						SortOrder.asc
					);

					expect(result).toEqual<Page<ClassInfoDto>>({
						data: [
							{
								id: group.id,
								name: group.name,
								type: ClassRootType.GROUP,
								teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
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
				const schoolYear = schoolYearDoFactory.build();
				const school = schoolFactory.build({ currentYear: schoolYear });

				const { studentUser } = UserAndAccountTestFactory.buildStudent();
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const { adminUser } = UserAndAccountTestFactory.buildAdmin();
				const studentRole = roleDtoFactory.buildWithId({
					id: studentUser.roles[0].id,
					name: studentUser.roles[0].name,
				});
				const teacherRole = roleDtoFactory.buildWithId({
					id: teacherUser.roles[0].id,
					name: teacherUser.roles[0].name,
				});

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
				schoolYearService.getAllSchoolYears.mockResolvedValueOnce([schoolYear]);
				classService.find.mockResolvedValueOnce([...clazzes, clazz]);
				groupService.findByScope.mockResolvedValueOnce(new Page<Group>([group, groupWithSystem], 2));
				systemService.getSystems.mockResolvedValueOnce([system]);
				roleService.findByName.mockResolvedValueOnce(studentRole);
				config.featureSchulconnexCourseSyncEnabled = true;
				roleService.findByName.mockResolvedValueOnce(teacherRole);
				const teacherUserDo = {
					id: teacherUser.id,
					firstName: teacherUser.firstName,
					lastName: teacherUser.lastName,
					schoolId: teacherUser.school.id,
				} as UserDo;
				userService.findByIds.mockResolvedValue([teacherUserDo]);
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
		});
	});
});
