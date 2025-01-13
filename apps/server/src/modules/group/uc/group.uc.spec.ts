import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { RoleService } from '@modules/role';
import { RoleDto } from '@modules/role/service/dto/role.dto';
import { School, SchoolService } from '@modules/school/domain';
import { schoolFactory } from '@modules/school/testing';
import { UserService } from '@modules/user';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Page, UserDO } from '@shared/domain/domainobject';
import { Role, User } from '@shared/domain/entity';
import { Permission, SortOrder } from '@shared/domain/interface';
import {
	groupFactory,
	roleDtoFactory,
	roleFactory,
	schoolEntityFactory,
	setupEntities,
	UserAndAccountTestFactory,
	userDoFactory,
	userFactory,
} from '@shared/testing';
import { Logger } from '@src/core/logger';
import { Group, GroupTypes, GroupVisibilityPermission } from '../domain';
import { GroupService } from '../service';
import { ResolvedGroupDto } from './dto';
import { GroupUc } from './group.uc';

describe(GroupUc.name, () => {
	let module: TestingModule;
	let uc: GroupUc;

	let groupService: DeepMocked<GroupService>;
	let userService: DeepMocked<UserService>;
	let roleService: DeepMocked<RoleService>;
	let schoolService: DeepMocked<SchoolService>;
	let authorizationService: DeepMocked<AuthorizationService>;
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
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(GroupUc);
		groupService = module.get(GroupService);
		userService = module.get(UserService);
		roleService = module.get(RoleService);
		schoolService = module.get(SchoolService);
		authorizationService = module.get(AuthorizationService);
		logger = module.get(Logger);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
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

		describe('when user in group is not found', () => {
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
				userService.findByIdOrNull.mockResolvedValueOnce(null);
				roleService.findById.mockResolvedValueOnce(studentRole);

				return {
					teacherId: teacherUser.id,
					group,
				};
			};

			it('should log missing user', async () => {
				const { teacherId, group } = setup();

				await uc.getGroup(teacherId, group.id);

				expect(logger.warning).toHaveBeenCalled();
			});
		});
	});

	describe('getAllGroups', () => {
		describe('when the user has no permission', () => {
			const setup = () => {
				const school: School = schoolFactory.build();
				const user: User = userFactory.buildWithId();
				const error = new ForbiddenException();

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				authorizationService.checkPermission.mockImplementation(() => {
					throw error;
				});

				return {
					user,
					error,
					school,
				};
			};

			it('should throw forbidden', async () => {
				const { user, error, school } = setup();

				await expect(() => uc.getAllGroups(user.id, school.id)).rejects.toThrow(error);
			});
		});

		describe('when an admin requests groups', () => {
			const setup = () => {
				const school: School = schoolFactory.build();
				const role: Role = roleFactory.buildWithId({
					permissions: [Permission.GROUP_FULL_ADMIN, Permission.GROUP_VIEW],
				});
				const user: User = userFactory.buildWithId({
					roles: [role],
					school: schoolEntityFactory.buildWithId(undefined, school.id),
				});
				const userRole: RoleDto = roleDtoFactory.build({
					id: role.id,
					name: role.name,
				});
				const userDto: UserDO = userDoFactory.build({
					id: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email,
					roles: [{ id: role.id, name: role.name }],
				});
				const group: Group = groupFactory.build({ organizationId: school.id });

				const nameQuery = 'name';

				schoolService.getSchoolById.mockResolvedValue(school);
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				authorizationService.hasAllPermissions.mockReturnValueOnce(true);
				groupService.findGroupsForUser.mockResolvedValue(new Page<Group>([group], 1));
				userService.findByIdOrNull.mockResolvedValue(userDto);
				roleService.findById.mockResolvedValue(userRole);

				return {
					user,
					school,
					group,
					nameQuery,
					userRole,
					userDto,
				};
			};

			it('should should search for the groups', async () => {
				const { user, school, nameQuery } = setup();

				await uc.getAllGroups(user.id, school.id, {}, nameQuery, true);

				expect(groupService.findGroupsForUser).toHaveBeenCalledWith(
					user,
					GroupVisibilityPermission.ALL_SCHOOL_GROUPS,
					true,
					nameQuery,
					{ order: { name: SortOrder.asc } }
				);
			});

			it('should return the groups of the school', async () => {
				const { user, group, school, nameQuery, userRole, userDto } = setup();

				const result = await uc.getAllGroups(user.id, school.id, {}, nameQuery, true);

				expect(result).toEqual({
					data: [
						{
							...group.getProps(),
							users: [{ role: userRole, user: userDto }],
						},
					],
					total: 1,
				});
			});
		});

		describe('when teacher requests groups and he can see students', () => {
			const setup = () => {
				const school: School = schoolFactory.build();
				const role: Role = roleFactory.buildWithId({ permissions: [Permission.STUDENT_LIST, Permission.GROUP_VIEW] });
				const user: User = userFactory.buildWithId({
					roles: [role],
					school: schoolEntityFactory.buildWithId(undefined, school.id),
				});
				const userRole: RoleDto = roleDtoFactory.build({
					id: role.id,
					name: role.name,
				});
				const userDto: UserDO = userDoFactory.build({
					id: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email,
					roles: [{ id: role.id, name: role.name }],
				});
				const group: Group = groupFactory.build({ organizationId: school.id });

				const nameQuery = 'name';

				schoolService.getSchoolById.mockResolvedValue(school);
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				authorizationService.hasAllPermissions.mockReturnValueOnce(false);
				authorizationService.hasPermission.mockReturnValueOnce(true);
				groupService.findGroupsForUser.mockResolvedValue(new Page<Group>([group], 1));
				userService.findByIdOrNull.mockResolvedValue(userDto);
				roleService.findById.mockResolvedValue(userRole);

				return {
					user,
					school,
					group,
					nameQuery,
					userRole,
					userDto,
				};
			};

			it('should should search for the groups', async () => {
				const { user, school, nameQuery } = setup();

				await uc.getAllGroups(user.id, school.id, {}, nameQuery, true);

				expect(groupService.findGroupsForUser).toHaveBeenCalledWith(
					user,
					GroupVisibilityPermission.ALL_SCHOOL_GROUPS,
					true,
					nameQuery,
					{ order: { name: SortOrder.asc } }
				);
			});

			it('should return the groups of the school', async () => {
				const { user, group, school, nameQuery, userRole, userDto } = setup();

				const result = await uc.getAllGroups(user.id, school.id, {}, nameQuery, true);

				expect(result).toEqual({
					data: [
						{
							...group.getProps(),
							users: [{ role: userRole, user: userDto }],
						},
					],
					total: 1,
				});
			});
		});

		describe('when teacher requests groups and he cannot see students', () => {
			const setup = () => {
				const school: School = schoolFactory.build();
				const role: Role = roleFactory.buildWithId({ permissions: [Permission.STUDENT_LIST, Permission.GROUP_VIEW] });
				const user: User = userFactory.buildWithId({
					roles: [role],
					school: schoolEntityFactory.buildWithId(undefined, school.id),
				});
				const userRole: RoleDto = roleDtoFactory.build({
					id: role.id,
					name: role.name,
				});
				const userDto: UserDO = userDoFactory.build({
					id: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email,
					roles: [{ id: role.id, name: role.name }],
				});
				const group: Group = groupFactory.build({ organizationId: school.id });

				const nameQuery = 'name';

				schoolService.getSchoolById.mockResolvedValue(school);
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				authorizationService.hasAllPermissions.mockReturnValueOnce(false);
				authorizationService.hasPermission.mockReturnValueOnce(false);
				groupService.findGroupsForUser.mockResolvedValue(new Page<Group>([group], 1));
				userService.findByIdOrNull.mockResolvedValue(userDto);
				roleService.findById.mockResolvedValue(userRole);

				return {
					user,
					school,
					group,
					nameQuery,
					userRole,
					userDto,
				};
			};

			it('should should search for the groups', async () => {
				const { user, school, nameQuery } = setup();

				await uc.getAllGroups(user.id, school.id, {}, nameQuery, true);

				expect(groupService.findGroupsForUser).toHaveBeenCalledWith(
					user,
					GroupVisibilityPermission.OWN_GROUPS,
					true,
					nameQuery,
					{ order: { name: SortOrder.asc } }
				);
			});

			it('should return the groups of the school', async () => {
				const { user, group, school, nameQuery, userRole, userDto } = setup();

				const result = await uc.getAllGroups(user.id, school.id, {}, nameQuery, true);

				expect(result).toEqual({
					data: [
						{
							...group.getProps(),
							users: [{ role: userRole, user: userDto }],
						},
					],
					total: 1,
				});
			});
		});
	});
});
