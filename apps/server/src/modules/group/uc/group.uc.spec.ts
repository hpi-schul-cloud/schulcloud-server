import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, Role, RoleName, SchoolDO, SortOrder, User, UserDO } from '@shared/domain';
import {
	groupFactory,
	roleDtoFactory,
	roleFactory,
	schoolDOFactory,
	setupEntities,
	userDoFactory,
	userFactory,
} from '@shared/testing';
import { Action, AuthorizationContext, AuthorizationService } from '@src/modules/authorization';
import { ClassService } from '@src/modules/class';
import { Class } from '@src/modules/class/domain';
import { classFactory } from '@src/modules/class/domain/testing/factory/class.factory';
import { RoleService } from '@src/modules/role';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { SchoolService } from '@src/modules/school';
import { SystemDto, SystemService } from '@src/modules/system';
import { UserService } from '@src/modules/user';
import { Group } from '../domain';
import { GroupService } from '../service';
import { ClassInfoDto } from './dto';
import { GroupUc } from './group.uc';

describe('GroupUc', () => {
	let module: TestingModule;
	let uc: GroupUc;

	let groupService: DeepMocked<GroupService>;
	let classService: DeepMocked<ClassService>;
	let systemService: DeepMocked<SystemService>;
	let userService: DeepMocked<UserService>;
	let roleService: DeepMocked<RoleService>;
	let schoolService: DeepMocked<SchoolService>;
	let authorizationService: DeepMocked<AuthorizationService>;

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
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get(GroupUc);
		groupService = module.get(GroupService);
		classService = module.get(ClassService);
		systemService = module.get(SystemService);
		userService = module.get(UserService);
		roleService = module.get(RoleService);
		schoolService = module.get(SchoolService);
		authorizationService = module.get(AuthorizationService);

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
				const school: SchoolDO = schoolDOFactory.buildWithId();
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

				const func = () => uc.findClassesForSchool(user.id, user.school.id);

				await expect(func).rejects.toThrow(error);
			});
		});

		describe('when the school has classes', () => {
			const setup = () => {
				const school: SchoolDO = schoolDOFactory.buildWithId();
				const teacherRoleEntity: Role = roleFactory.buildWithId({ name: RoleName.TEACHER });
				const studentRoleEntity: Role = roleFactory.buildWithId({ name: RoleName.STUDENT });
				const teacherRole: RoleDto = roleDtoFactory.buildWithId({
					id: teacherRoleEntity.id,
					name: teacherRoleEntity.name,
				});
				const studentRole: RoleDto = roleDtoFactory.buildWithId({
					id: studentRoleEntity.id,
					name: studentRoleEntity.name,
				});
				const teacher: User = userFactory.buildWithId({ roles: [teacherRoleEntity] });
				const student: User = userFactory.buildWithId({ roles: [studentRoleEntity] });
				const teacherUserDo: UserDO = userDoFactory.buildWithId({
					id: teacher.id,
					lastName: teacher.lastName,
					roles: [{ id: teacherRoleEntity.id, name: teacherRoleEntity.name }],
				});
				const studentUserDo: UserDO = userDoFactory.buildWithId({
					id: student.id,
					lastName: student.lastName,
					roles: [{ id: studentRoleEntity.id, name: studentRole.name }],
				});
				const clazz: Class = classFactory.build({ name: 'A', teacherIds: [teacher.id], source: 'LDAP' });
				const system: SystemDto = new SystemDto({
					id: new ObjectId().toHexString(),
					displayName: 'External System',
					type: 'oauth2',
				});
				const group: Group = groupFactory.build({
					name: 'B',
					users: [{ userId: teacher.id, roleId: teacherRoleEntity.id }],
					externalSource: undefined,
				});
				const groupWithSystem: Group = groupFactory.build({
					name: 'C',
					externalSource: { externalId: 'externalId', systemId: system.id },
					users: [
						{ userId: teacher.id, roleId: teacherRoleEntity.id },
						{ userId: student.id, roleId: studentRoleEntity.id },
					],
				});

				schoolService.getSchoolById.mockResolvedValueOnce(school);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(teacher);
				classService.findClassesForSchool.mockResolvedValueOnce([clazz]);
				groupService.findClassesForSchool.mockResolvedValueOnce([group, groupWithSystem]);
				systemService.findById.mockResolvedValue(system);
				userService.findById.mockImplementation((userId: string): Promise<UserDO> => {
					if (userId === teacher.id) {
						return Promise.resolve(teacherUserDo);
					}

					if (userId === student.id) {
						return Promise.resolve(studentUserDo);
					}

					throw new Error();
				});
				roleService.findById.mockImplementation((roleId: string): Promise<RoleDto> => {
					if (roleId === teacherRoleEntity.id) {
						return Promise.resolve(teacherRole);
					}

					if (roleId === studentRoleEntity.id) {
						return Promise.resolve(studentRole);
					}

					throw new Error();
				});

				return {
					teacher,
					school,
					clazz,
					group,
					groupWithSystem,
					system,
				};
			};

			it('should check the CLASS_LIST permission', async () => {
				const { teacher, school } = setup();

				await uc.findClassesForSchool(teacher.id, teacher.school.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith<[User, SchoolDO, AuthorizationContext]>(
					teacher,
					school,
					{
						action: Action.read,
						requiredPermissions: [Permission.CLASS_LIST],
					}
				);
			});

			describe('when no pagination is given', () => {
				it('should return all classes sorted by name', async () => {
					const { teacher, clazz, group, groupWithSystem, system } = setup();

					const result: ClassInfoDto[] = await uc.findClassesForSchool(teacher.id, teacher.school.id);

					expect(result).toEqual<ClassInfoDto[]>([
						{
							name: clazz.name,
							externalSourceName: clazz.source,
							teachers: [teacher.lastName],
						},
						{
							name: group.name,
							teachers: [teacher.lastName],
						},
						{
							name: groupWithSystem.name,
							externalSourceName: system.displayName,
							teachers: [teacher.lastName],
						},
					]);
				});
			});

			describe('when sorting by external source name in descending order', () => {
				it('should return all classes sorted by external source name in descending order', async () => {
					const { teacher, clazz, group, groupWithSystem, system } = setup();

					const result: ClassInfoDto[] = await uc.findClassesForSchool(
						teacher.id,
						teacher.school.id,
						undefined,
						undefined,
						'externalSourceName',
						SortOrder.desc
					);

					expect(result).toEqual<ClassInfoDto[]>([
						{
							name: clazz.name,
							externalSourceName: clazz.source,
							teachers: [teacher.lastName],
						},
						{
							name: groupWithSystem.name,
							externalSourceName: system.displayName,
							teachers: [teacher.lastName],
						},
						{
							name: group.name,
							teachers: [teacher.lastName],
						},
					]);
				});
			});

			describe('when using pagination', () => {
				it('should return the selected page', async () => {
					const { teacher, group } = setup();

					const result: ClassInfoDto[] = await uc.findClassesForSchool(
						teacher.id,
						teacher.school.id,
						1,
						1,
						'name',
						SortOrder.asc
					);

					expect(result).toEqual<ClassInfoDto[]>([
						{
							name: group.name,
							teachers: [teacher.lastName],
						},
					]);
				});
			});
		});
	});
});
