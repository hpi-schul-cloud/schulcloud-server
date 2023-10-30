import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacySchoolDo } from '@shared/domain/domainobject/legacy-school.do';
import { Page } from '@shared/domain/domainobject/page';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SchoolYearEntity } from '@shared/domain/entity/schoolyear.entity';
import { User } from '@shared/domain/entity/user.entity';
import { SortOrder } from '@shared/domain/interface/find-options';
import { Permission } from '@shared/domain/interface/permission.enum';
import { groupFactory } from '@shared/testing/factory/domainobject/groups/group.factory';
import { legacySchoolDoFactory } from '@shared/testing/factory/domainobject/legacy-school.factory';
import { roleDtoFactory } from '@shared/testing/factory/role-dto.factory';
import { schoolYearFactory } from '@shared/testing/factory/schoolyear.factory';
import { UserAndAccountTestFactory } from '@shared/testing/factory/user-and-account.test.factory';
import { userDoFactory } from '@shared/testing/factory/user.do.factory';
import { userFactory } from '@shared/testing/factory/user.factory';
import { setupEntities } from '@shared/testing/setup-entities';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { Action } from '@src/modules/authorization/types/action.enum';
import { AuthorizationContext } from '@src/modules/authorization/types/authorization-context.interface';
import { Class } from '@src/modules/class/domain/class.do';
import { classFactory } from '@src/modules/class/domain/testing/factory/class.factory';
import { ClassService } from '@src/modules/class/service/class.service';
import { LegacySchoolService } from '@src/modules/legacy-school/service/legacy-school.service';
import { SchoolYearService } from '@src/modules/legacy-school/service/school-year.service';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { RoleService } from '@src/modules/role/service/role.service';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemService } from '@src/modules/system/service/system.service';
import { UserService } from '@src/modules/user/service/user.service';
import { Group } from '../domain/group';
import { GroupService } from '../service/group.service';
import { ClassInfoDto } from './dto/class-info.dto';
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

			it('should check the CLASS_LIST permission', async () => {
				const { teacherUser, school } = setup();

				await uc.findAllClassesForSchool(teacherUser.id, teacherUser.school.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith<[User, LegacySchoolDo, AuthorizationContext]>(
					teacherUser,
					school,
					{
						action: Action.read,
						requiredPermissions: [Permission.CLASS_LIST],
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
});
