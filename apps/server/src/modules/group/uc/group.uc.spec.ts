import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { ProvisioningConfig } from '@modules/provisioning';
import { RoleService } from '@modules/role';
import { RoleDto } from '@modules/role/service/dto/role.dto';
import { School, SchoolService } from '@modules/school/domain';
import { schoolFactory } from '@modules/school/testing';
import { UserService } from '@modules/user';
import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Page, UserDO } from '@shared/domain/domainobject';
import { Role, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import {
	groupFactory,
	roleDtoFactory,
	roleFactory,
	setupEntities,
	UserAndAccountTestFactory,
	userDoFactory,
	userFactory,
} from '@shared/testing';
import { Logger } from '@src/core/logger';
import { Group, GroupTypes } from '../domain';
import { GroupService } from '../service';
import { ResolvedGroupDto } from './dto';
import { GroupUc } from './group.uc';

describe('GroupUc', () => {
	let module: TestingModule;
	let uc: GroupUc;

	let groupService: DeepMocked<GroupService>;
	let userService: DeepMocked<UserService>;
	let roleService: DeepMocked<RoleService>;
	let schoolService: DeepMocked<SchoolService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let configService: DeepMocked<ConfigService<ProvisioningConfig, true>>;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
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
		configService = module.get(ConfigService);
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

				const func = () => uc.getAllGroups(user.id, school.id);

				await expect(func).rejects.toThrow(error);
			});
		});

		describe('when admin requests groups', () => {
			const setup = () => {
				const school: School = schoolFactory.build();
				const otherSchool: School = schoolFactory.build();
				const roles: Role = roleFactory.build({ permissions: [Permission.GROUP_FULL_ADMIN, Permission.GROUP_VIEW] });
				const user: User = userFactory.buildWithId({ roles: [roles], school });

				const groupInSchool: Group = groupFactory.build({ organizationId: school.id });
				const availableGroupInSchool: Group = groupFactory.build({ organizationId: school.id });
				const groupInOtherSchool: Group = groupFactory.build({ organizationId: otherSchool.id });

				const userRole: RoleDto = roleDtoFactory.build({
					id: user.roles[0].id,
					name: user.roles[0].name,
				});
				const userDto: UserDO = userDoFactory.build({
					id: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email,
					roles: [{ id: user.roles[0].id, name: user.roles[0].name }],
				});

				schoolService.getSchoolById.mockResolvedValue(school);
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				authorizationService.hasAllPermissions.mockReturnValueOnce(true);
				groupService.findAvailableGroups.mockResolvedValue(new Page<Group>([availableGroupInSchool], 1));
				groupService.findGroups.mockResolvedValue(new Page<Group>([groupInSchool, availableGroupInSchool], 2));
				userService.findByIdOrNull.mockResolvedValue(userDto);
				roleService.findById.mockResolvedValue(userRole);

				configService.get.mockReturnValueOnce(true);

				return {
					user,
					school,
					groupInSchool,
					availableGroupInSchool,
					groupInOtherSchool,
				};
			};

			describe('when requesting all groups', () => {
				it('should return all groups of the school', async () => {
					const { user, groupInSchool, availableGroupInSchool, school } = setup();

					const response = await uc.getAllGroups(user.id, school.id);

					expect(response).toMatchObject({
						data: [
							{
								id: groupInSchool.id,
								name: groupInSchool.name,
								type: GroupTypes.CLASS,
								externalSource: groupInSchool.externalSource,
								organizationId: groupInSchool.organizationId,
								users: [
									{
										user: {
											id: user.id,
											firstName: user.firstName,
											lastName: user.lastName,
											email: user.email,
										},
										role: {
											id: user.roles[0].id,
											name: user.roles[0].name,
										},
									},
								],
							},
							{
								id: availableGroupInSchool.id,
								name: availableGroupInSchool.name,
								type: GroupTypes.CLASS,
								externalSource: availableGroupInSchool.externalSource,
								organizationId: availableGroupInSchool.organizationId,
								users: [
									{
										user: {
											id: user.id,
											firstName: user.firstName,
											lastName: user.lastName,
											email: user.email,
										},
										role: {
											id: user.roles[0].id,
											name: user.roles[0].name,
										},
									},
								],
							},
						],
						total: 2,
					});
				});

				it('should not return group not in school', async () => {
					const { user, groupInOtherSchool, school } = setup();

					const response = await uc.getAllGroups(user.id, school.id);

					expect(response).not.toMatchObject({
						data: [
							{
								id: groupInOtherSchool.id,
								name: groupInOtherSchool.name,
								type: GroupTypes.CLASS,
								externalSource: groupInOtherSchool.externalSource,
								organizationId: groupInOtherSchool.organizationId,
								users: [
									{
										user: {
											id: user.id,
											firstName: user.firstName,
											lastName: user.lastName,
											email: user.email,
										},
										role: {
											id: user.roles[0].id,
											name: user.roles[0].name,
										},
									},
								],
							},
						],
						total: 1,
					});
				});
			});

			describe('when requesting all available groups', () => {
				it('should return all available groups for course sync', async () => {
					const { user, availableGroupInSchool, school } = setup();

					const response = await uc.getAllGroups(user.id, school.id, undefined, undefined, true);

					expect(response).toMatchObject({
						data: [
							{
								id: availableGroupInSchool.id,
								name: availableGroupInSchool.name,
								type: GroupTypes.CLASS,
								externalSource: availableGroupInSchool.externalSource,
								organizationId: availableGroupInSchool.organizationId,
								users: [
									{
										user: {
											id: user.id,
											firstName: user.firstName,
											lastName: user.lastName,
											email: user.email,
										},
										role: {
											id: user.roles[0].id,
											name: user.roles[0].name,
										},
									},
								],
							},
						],
						total: 1,
					});
				});
			});
		});

		describe('when teacher requests groups', () => {
			const setup = () => {
				const school: School = schoolFactory.build();
				const roles: Role = roleFactory.build({ permissions: [Permission.GROUP_VIEW] });
				const user: User = userFactory.buildWithId({ roles: [roles], school });

				const teachersGroup: Group = groupFactory.build({
					organizationId: school.id,
					users: [{ userId: user.id, roleId: user.roles[0].id }],
				});
				const availableTeachersGroup: Group = groupFactory.build({
					organizationId: school.id,
					users: [{ userId: user.id, roleId: user.roles[0].id }],
				});
				const notTeachersGroup: Group = groupFactory.build({ organizationId: school.id });

				const userRole: RoleDto = roleDtoFactory.build({
					id: user.roles[0].id,
					name: user.roles[0].name,
				});
				const userDto: UserDO = userDoFactory.build({
					id: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email,
					roles: [{ id: user.roles[0].id, name: user.roles[0].name }],
				});

				schoolService.getSchoolById.mockResolvedValue(school);
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				authorizationService.hasAllPermissions.mockReturnValue(false);
				groupService.findAvailableGroups.mockResolvedValue(new Page<Group>([availableTeachersGroup], 1));
				groupService.findGroups.mockResolvedValue(new Page<Group>([teachersGroup, availableTeachersGroup], 2));
				userService.findByIdOrNull.mockResolvedValue(userDto);
				roleService.findById.mockResolvedValue(userRole);

				configService.get.mockReturnValueOnce(true);

				return {
					user,
					school,
					teachersGroup,
					availableTeachersGroup,
					notTeachersGroup,
				};
			};

			describe('when requesting all groups', () => {
				it('should return all groups the teacher is part of', async () => {
					const { user, teachersGroup, availableTeachersGroup, school } = setup();

					const response = await uc.getAllGroups(user.id, school.id);

					expect(response).toMatchObject({
						data: [
							{
								id: teachersGroup.id,
								name: teachersGroup.name,
								type: GroupTypes.CLASS,
								externalSource: teachersGroup.externalSource,
								organizationId: teachersGroup.organizationId,
								users: [
									{
										user: {
											id: user.id,
											firstName: user.firstName,
											lastName: user.lastName,
											email: user.email,
										},
										role: {
											id: user.roles[0].id,
											name: user.roles[0].name,
										},
									},
								],
							},
							{
								id: availableTeachersGroup.id,
								name: availableTeachersGroup.name,
								type: GroupTypes.CLASS,
								externalSource: availableTeachersGroup.externalSource,
								organizationId: availableTeachersGroup.organizationId,
								users: [
									{
										user: {
											id: user.id,
											firstName: user.firstName,
											lastName: user.lastName,
											email: user.email,
										},
										role: {
											id: user.roles[0].id,
											name: user.roles[0].name,
										},
									},
								],
							},
						],
						total: 2,
					});
				});

				it('should not return group without the teacher', async () => {
					const { user, notTeachersGroup, school } = setup();

					const response = await uc.getAllGroups(user.id, school.id);

					expect(response).not.toMatchObject({
						data: [
							{
								id: notTeachersGroup.id,
								name: notTeachersGroup.name,
								type: GroupTypes.CLASS,
								externalSource: notTeachersGroup.externalSource,
								organizationId: notTeachersGroup.organizationId,
								users: [
									{
										user: {
											id: user.id,
											firstName: user.firstName,
											lastName: user.lastName,
											email: user.email,
										},
										role: {
											id: user.roles[0].id,
											name: user.roles[0].name,
										},
									},
								],
							},
						],
						total: 1,
					});
				});
			});

			describe('when requesting all available groups', () => {
				it('should return all available groups for course sync the teacher is part of', async () => {
					const { user, availableTeachersGroup, school } = setup();

					const response = await uc.getAllGroups(user.id, school.id, undefined, undefined, true);

					expect(response).toMatchObject({
						data: [
							{
								id: availableTeachersGroup.id,
								name: availableTeachersGroup.name,
								type: GroupTypes.CLASS,
								externalSource: availableTeachersGroup.externalSource,
								organizationId: availableTeachersGroup.organizationId,
								users: [
									{
										user: {
											id: user.id,
											firstName: user.firstName,
											lastName: user.lastName,
											email: user.email,
										},
										role: {
											id: user.roles[0].id,
											name: user.roles[0].name,
										},
									},
								],
							},
						],
						total: 1,
					});
				});
			});
		});
	});
});
