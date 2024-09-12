import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Group, GroupService, GroupTypes } from '@modules/group';
import { CourseDoService } from '@modules/learnroom';
import { Course } from '@modules/learnroom/domain';
import { courseFactory } from '@modules/learnroom/testing';
import {
	LegacySchoolService,
	SchoolSystemOptionsService,
	SchulConneXProvisioningOptions,
} from '@modules/legacy-school';
import { RoleDto, RoleService } from '@modules/role';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { ExternalSource, LegacySchoolDo, Page, RoleReference, UserDO } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import {
	externalGroupDtoFactory,
	externalSchoolDtoFactory,
	groupFactory,
	legacySchoolDoFactory,
	roleDtoFactory,
	roleFactory,
	userDoFactory,
} from '@shared/testing';
import { Logger } from '@src/core/logger';
import { ExternalGroupDto, ExternalSchoolDto } from '../../../dto';
import { SchoolForGroupNotFoundLoggable, UserForGroupNotFoundLoggable } from '../../../loggable';
import { SchulconnexGroupProvisioningService } from './schulconnex-group-provisioning.service';

describe(SchulconnexGroupProvisioningService.name, () => {
	let module: TestingModule;
	let service: SchulconnexGroupProvisioningService;

	let userService: DeepMocked<UserService>;
	let schoolService: DeepMocked<LegacySchoolService>;
	let roleService: DeepMocked<RoleService>;
	let groupService: DeepMocked<GroupService>;
	let courseService: DeepMocked<CourseDoService>;
	let schoolSystemOptionsService: DeepMocked<SchoolSystemOptionsService>;
	let logger: DeepMocked<Logger>;
	const mockDate = new Date(2024, 1, 1);

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexGroupProvisioningService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
				{
					provide: CourseDoService,
					useValue: createMock<CourseDoService>(),
				},
				{
					provide: SchoolSystemOptionsService,
					useValue: createMock<SchoolSystemOptionsService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(SchulconnexGroupProvisioningService);
		userService = module.get(UserService);
		schoolService = module.get(LegacySchoolService);
		roleService = module.get(RoleService);
		groupService = module.get(GroupService);
		courseService = module.get(CourseDoService);
		schoolSystemOptionsService = module.get(SchoolSystemOptionsService);
		logger = module.get(Logger);

		jest.useFakeTimers();
		jest.setSystemTime(mockDate);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('filterExternalGroups', () => {
		describe('when all options are on', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const systemId: EntityId = new ObjectId().toHexString();

				const classGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.CLASS,
				});
				const courseGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.COURSE,
				});
				const otherGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.OTHER,
				});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(
					new SchulConneXProvisioningOptions().set({
						groupProvisioningClassesEnabled: true,
						groupProvisioningCoursesEnabled: true,
						groupProvisioningOtherEnabled: true,
						schoolExternalToolProvisioningEnabled: true,
					})
				);

				return {
					schoolId,
					systemId,
					classGroup,
					courseGroup,
					otherGroup,
				};
			};

			it('should load the configured options from the school', async () => {
				const { schoolId, systemId, classGroup, courseGroup, otherGroup } = setup();

				await service.filterExternalGroups([classGroup, courseGroup, otherGroup], schoolId, systemId);

				expect(schoolSystemOptionsService.getProvisioningOptions).toHaveBeenCalledWith(
					SchulConneXProvisioningOptions,
					schoolId,
					systemId
				);
			});

			it('should not filter', async () => {
				const { schoolId, systemId, classGroup, courseGroup, otherGroup } = setup();

				const result = await service.filterExternalGroups([classGroup, courseGroup, otherGroup], schoolId, systemId);

				expect(result).toEqual([classGroup, courseGroup, otherGroup]);
			});
		});

		describe('when only classes are active', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const systemId: EntityId = new ObjectId().toHexString();

				const classGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.CLASS,
				});
				const courseGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.COURSE,
				});
				const otherGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.OTHER,
				});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(
					new SchulConneXProvisioningOptions().set({
						groupProvisioningClassesEnabled: true,
						groupProvisioningCoursesEnabled: false,
						groupProvisioningOtherEnabled: false,
						schoolExternalToolProvisioningEnabled: false,
					})
				);

				return {
					schoolId,
					systemId,
					classGroup,
					courseGroup,
					otherGroup,
				};
			};

			it('should filter for classes', async () => {
				const { schoolId, systemId, classGroup, courseGroup, otherGroup } = setup();

				const result = await service.filterExternalGroups([classGroup, courseGroup, otherGroup], schoolId, systemId);

				expect(result).toEqual([classGroup]);
			});
		});

		describe('when only courses are active', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const systemId: EntityId = new ObjectId().toHexString();

				const classGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.CLASS,
				});
				const courseGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.COURSE,
				});
				const otherGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.OTHER,
				});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(
					new SchulConneXProvisioningOptions().set({
						groupProvisioningClassesEnabled: false,
						groupProvisioningCoursesEnabled: true,
						groupProvisioningOtherEnabled: false,
						schoolExternalToolProvisioningEnabled: false,
					})
				);

				return {
					schoolId,
					systemId,
					classGroup,
					courseGroup,
					otherGroup,
				};
			};

			it('should filter for courses', async () => {
				const { schoolId, systemId, classGroup, courseGroup, otherGroup } = setup();

				const result = await service.filterExternalGroups([classGroup, courseGroup, otherGroup], schoolId, systemId);

				expect(result).toEqual([courseGroup]);
			});
		});

		describe('when only other groups are active', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const systemId: EntityId = new ObjectId().toHexString();

				const classGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.CLASS,
				});
				const courseGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.COURSE,
				});
				const otherGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.OTHER,
				});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(
					new SchulConneXProvisioningOptions().set({
						groupProvisioningClassesEnabled: false,
						groupProvisioningCoursesEnabled: false,
						groupProvisioningOtherEnabled: true,
						schoolExternalToolProvisioningEnabled: false,
					})
				);

				return {
					schoolId,
					systemId,
					classGroup,
					courseGroup,
					otherGroup,
				};
			};

			it('should filter for other groups', async () => {
				const { schoolId, systemId, classGroup, courseGroup, otherGroup } = setup();

				const result = await service.filterExternalGroups([classGroup, courseGroup, otherGroup], schoolId, systemId);

				expect(result).toEqual([otherGroup]);
			});
		});

		describe('when no schoolId was provided', () => {
			const setup = () => {
				const systemId: EntityId = new ObjectId().toHexString();

				const classGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.CLASS,
				});
				const courseGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.COURSE,
				});
				const otherGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.OTHER,
				});

				return {
					systemId,
					classGroup,
					courseGroup,
					otherGroup,
				};
			};

			it('should use the default option', async () => {
				const { systemId, classGroup, courseGroup, otherGroup } = setup();

				const result = await service.filterExternalGroups([classGroup, courseGroup, otherGroup], undefined, systemId);

				expect(result).toEqual([classGroup]);
			});
		});
	});

	describe('provisionExternalGroup', () => {
		describe('when school for group could not be found', () => {
			const setup = () => {
				const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build();
				const externalSchoolDto: ExternalSchoolDto = externalSchoolDtoFactory.build();
				const systemId = 'systemId';
				schoolService.getSchoolByExternalId.mockResolvedValueOnce(null);

				return {
					externalSchoolDto,
					externalGroupDto,
					systemId,
				};
			};

			it('should log a SchoolForGroupNotFoundLoggable', async () => {
				const { externalGroupDto, externalSchoolDto, systemId } = setup();

				await service.provisionExternalGroup(externalGroupDto, externalSchoolDto, systemId);

				expect(logger.info).toHaveBeenCalledWith(
					new SchoolForGroupNotFoundLoggable(externalGroupDto, externalSchoolDto)
				);
			});

			it('should not call groupService.save', async () => {
				const { externalGroupDto, externalSchoolDto, systemId } = setup();

				await service.provisionExternalGroup(externalGroupDto, externalSchoolDto, systemId);

				expect(groupService.save).not.toHaveBeenCalled();
			});

			it('should return null', async () => {
				const { externalGroupDto, externalSchoolDto, systemId } = setup();

				const result: Group | null = await service.provisionExternalGroup(
					externalGroupDto,
					externalSchoolDto,
					systemId
				);

				expect(result).toBeNull();
			});
		});

		describe('when the user cannot be found', () => {
			const setup = () => {
				const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build({ otherUsers: undefined });
				const systemId = 'systemId';
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();

				userService.findByExternalId.mockResolvedValue(null);
				schoolService.getSchoolByExternalId.mockResolvedValue(school);

				return {
					externalGroupDto,
					systemId,
				};
			};

			it('should log a UserForGroupNotFoundLoggable', async () => {
				const { externalGroupDto, systemId } = setup();

				await expect(service.provisionExternalGroup(externalGroupDto, undefined, systemId)).rejects.toThrow();

				expect(logger.info).toHaveBeenCalledWith(new UserForGroupNotFoundLoggable(externalGroupDto.user));
			});

			it('should throw a not found exception', async () => {
				const { externalGroupDto, systemId } = setup();

				await expect(service.provisionExternalGroup(externalGroupDto, undefined, systemId)).rejects.toThrow(
					NotFoundLoggableException
				);
			});
		});

		describe('when provisioning a new group with other group members', () => {
			const setup = () => {
				const school: LegacySchoolDo = legacySchoolDoFactory.build({ id: 'schoolId' });
				const student: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }])
					.build({ id: new ObjectId().toHexString(), externalId: 'studentExternalId' });
				const teacher: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.TEACHER }])
					.build({ id: new ObjectId().toHexString(), externalId: 'teacherExternalId' });
				const studentRole: RoleDto = roleDtoFactory.build({ name: RoleName.STUDENT });
				const teacherRole: RoleDto = roleDtoFactory.build({ name: RoleName.TEACHER });
				const externalSchoolDto: ExternalSchoolDto = externalSchoolDtoFactory.build();
				const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build({
					user: {
						externalUserId: student.externalId as string,
						roleName: RoleName.STUDENT,
					},
					otherUsers: [
						{
							externalUserId: teacher.externalId as string,
							roleName: RoleName.TEACHER,
						},
					],
				});
				const systemId = new ObjectId().toHexString();

				schoolService.getSchoolByExternalId.mockResolvedValueOnce(school);
				groupService.findByExternalSource.mockResolvedValueOnce(null);
				userService.findByExternalId.mockResolvedValueOnce(student);
				roleService.findByNames.mockResolvedValueOnce([studentRole]);
				userService.findByExternalId.mockResolvedValueOnce(teacher);
				roleService.findByNames.mockResolvedValueOnce([teacherRole]);
				groupService.save.mockImplementationOnce((group) => Promise.resolve(group));

				return {
					externalSchoolDto,
					externalGroupDto,
					school,
					student,
					teacher,
					studentRole,
					teacherRole,
					systemId,
				};
			};

			it('should use the correct school', async () => {
				const { externalGroupDto, externalSchoolDto, systemId } = setup();

				await service.provisionExternalGroup(externalGroupDto, externalSchoolDto, systemId);

				expect(schoolService.getSchoolByExternalId).toHaveBeenCalledWith(externalSchoolDto.externalId, systemId);
			});

			it('should save a new group', async () => {
				const { externalGroupDto, externalSchoolDto, school, student, studentRole, teacher, teacherRole, systemId } =
					setup();

				await service.provisionExternalGroup(externalGroupDto, externalSchoolDto, systemId);

				expect(groupService.save).toHaveBeenCalledWith({
					props: {
						id: expect.any(String),
						name: externalGroupDto.name,
						externalSource: {
							externalId: externalGroupDto.externalId,
							systemId,
							lastSyncedAt: mockDate,
						},
						type: externalGroupDto.type,
						organizationId: school.id,
						validPeriod: { from: externalGroupDto.from, until: externalGroupDto.until },
						users: [
							{
								userId: student.id,
								roleId: studentRole.id,
							},
							{
								userId: teacher.id,
								roleId: teacherRole.id,
							},
						],
					},
				});
			});

			it('should return the saved group', async () => {
				const { externalGroupDto, externalSchoolDto, school, student, studentRole, teacher, teacherRole, systemId } =
					setup();

				const result: Group | null = await service.provisionExternalGroup(
					externalGroupDto,
					externalSchoolDto,
					systemId
				);

				expect(result?.getProps()).toEqual({
					id: expect.any(String),
					name: externalGroupDto.name,
					externalSource: {
						externalId: externalGroupDto.externalId,
						systemId,
						lastSyncedAt: mockDate,
					},
					type: externalGroupDto.type,
					organizationId: school.id,
					validPeriod: { from: externalGroupDto.from, until: externalGroupDto.until },
					users: [
						{
							userId: student.id,
							roleId: studentRole.id,
						},
						{
							userId: teacher.id,
							roleId: teacherRole.id,
						},
					],
				});
			});
		});

		describe('when provisioning an existing group without other group members', () => {
			const setup = () => {
				const student: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }])
					.build({ id: new ObjectId().toHexString(), externalId: 'studentExternalId' });
				const teacherId = new ObjectId().toHexString();
				const teacherRoleId = new ObjectId().toHexString();
				const teacher: UserDO = userDoFactory
					.withRoles([{ id: teacherRoleId, name: RoleName.TEACHER }])
					.build({ id: teacherId, externalId: 'teacherExternalId' });
				const studentRole: RoleDto = roleDtoFactory.build({ name: RoleName.STUDENT });
				const teacherRole: RoleDto = roleDtoFactory.build({ id: teacherRoleId, name: RoleName.TEACHER });
				const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build({
					user: {
						externalUserId: student.externalId as string,
						roleName: RoleName.STUDENT,
					},
					otherUsers: undefined,
				});
				const group: Group = groupFactory.build({ users: [{ userId: teacherId, roleId: teacherRoleId }] });
				const systemId = new ObjectId().toHexString();

				groupService.findByExternalSource.mockResolvedValueOnce(group);
				userService.findByExternalId.mockResolvedValueOnce(student);
				roleService.findByNames.mockResolvedValueOnce([studentRole]);

				return {
					externalGroupDto,
					student,
					teacher,
					studentRole,
					teacherRole,
					systemId,
					group,
				};
			};

			it('should update the group and only add the user', async () => {
				const { externalGroupDto, student, studentRole, teacher, teacherRole, systemId, group } = setup();

				await service.provisionExternalGroup(externalGroupDto, undefined, systemId);

				expect(groupService.save).toHaveBeenCalledWith({
					props: {
						id: group.id,
						name: externalGroupDto.name,
						externalSource: {
							externalId: externalGroupDto.externalId,
							systemId,
							lastSyncedAt: mockDate,
						},
						type: externalGroupDto.type,
						organizationId: undefined,
						validPeriod: { from: externalGroupDto.from, until: externalGroupDto.until },
						users: [
							{
								userId: teacher.id,
								roleId: teacherRole.id,
							},
							{
								userId: student.id,
								roleId: studentRole.id,
							},
						],
					},
				});
			});
		});

		describe('when provisioning an existing group with empty other group members', () => {
			const setup = () => {
				const student: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }])
					.build({ id: new ObjectId().toHexString(), externalId: 'studentExternalId' });
				const teacherId = new ObjectId().toHexString();
				const teacherRoleId = new ObjectId().toHexString();
				const teacher: UserDO = userDoFactory
					.withRoles([{ id: teacherRoleId, name: RoleName.TEACHER }])
					.build({ id: teacherId, externalId: 'teacherExternalId' });
				const studentRole: RoleDto = roleDtoFactory.build({ name: RoleName.STUDENT });
				const teacherRole: RoleDto = roleDtoFactory.build({ id: teacherRoleId, name: RoleName.TEACHER });
				const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build({
					user: {
						externalUserId: student.externalId as string,
						roleName: RoleName.STUDENT,
					},
					otherUsers: [],
				});
				const group: Group = groupFactory.build({ users: [{ userId: teacherId, roleId: teacherRoleId }] });
				const systemId = new ObjectId().toHexString();

				groupService.findByExternalSource.mockResolvedValueOnce(group);
				userService.findByExternalId.mockResolvedValueOnce(student);
				roleService.findByNames.mockResolvedValueOnce([studentRole]);

				return {
					externalGroupDto,
					student,
					teacher,
					studentRole,
					teacherRole,
					systemId,
					group,
				};
			};

			it('should update the group with all users', async () => {
				const { externalGroupDto, student, studentRole, systemId, group } = setup();

				await service.provisionExternalGroup(externalGroupDto, undefined, systemId);

				expect(groupService.save).toHaveBeenCalledWith({
					props: {
						id: group.id,
						name: externalGroupDto.name,
						externalSource: {
							externalId: externalGroupDto.externalId,
							systemId,
							lastSyncedAt: mockDate,
						},
						type: externalGroupDto.type,
						organizationId: undefined,
						validPeriod: { from: externalGroupDto.from, until: externalGroupDto.until },
						users: [
							{
								userId: student.id,
								roleId: studentRole.id,
							},
						],
					},
				});
			});
		});
	});

	describe('removeExternalGroupsAndAffiliation', () => {
		describe('when group membership of user has not changed', () => {
			const setup = () => {
				const systemId = 'systemId';
				const externalUserId = 'externalUserId';
				const role: RoleReference = roleFactory.buildWithId();
				const user: UserDO = userDoFactory.buildWithId({ roles: [role], externalId: externalUserId });

				const existingGroups: Group[] = groupFactory.buildList(2, {
					users: [{ userId: user.id as string, roleId: role.id }],
				});

				const firstExternalGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					externalId: existingGroups[0].externalSource?.externalId,
					user: { externalUserId, roleName: role.name },
				});
				const secondExternalGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					externalId: existingGroups[1].externalSource?.externalId,
					user: { externalUserId, roleName: role.name },
				});
				const externalGroups: ExternalGroupDto[] = [firstExternalGroup, secondExternalGroup];

				userService.findByExternalId.mockResolvedValue(user);
				groupService.findGroups.mockResolvedValue(new Page<Group>(existingGroups, 2));

				return {
					externalGroups,
					systemId,
					externalUserId,
					user,
				};
			};

			it('should find groups', async () => {
				const { externalGroups, systemId, externalUserId, user } = setup();

				await service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

				expect(groupService.findGroups).toHaveBeenCalledWith({ userId: user.id });
			});

			it('should not save the group', async () => {
				const { externalGroups, systemId, externalUserId } = setup();

				await service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

				expect(groupService.save).not.toHaveBeenCalled();
			});

			it('should not delete the group', async () => {
				const { externalGroups, systemId, externalUserId } = setup();

				await service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

				expect(groupService.delete).not.toHaveBeenCalled();
			});
		});

		describe('when user is not part of a group anymore', () => {
			describe('when group is empty after removal of the User and is not synced to a course', () => {
				const setup = () => {
					const systemId = 'systemId';
					const externalUserId = 'externalUserId';
					const role: RoleReference = roleFactory.buildWithId();
					const user: UserDO = userDoFactory.buildWithId({ roles: [role], externalId: externalUserId });
					const firstExistingGroup: Group = groupFactory.build({
						users: [{ userId: user.id as string, roleId: role.id }],
						externalSource: new ExternalSource({
							externalId: 'externalId-1',
							systemId,
							lastSyncedAt: mockDate,
						}),
					});
					const secondExistingGroup: Group = groupFactory.build({
						users: [{ userId: user.id as string, roleId: role.id }],
						externalSource: new ExternalSource({
							externalId: 'externalId-2',
							systemId,
							lastSyncedAt: mockDate,
						}),
					});
					const existingGroups = [firstExistingGroup, secondExistingGroup];

					const firstExternalGroup: ExternalGroupDto = externalGroupDtoFactory.build({
						externalId: existingGroups[0].externalSource?.externalId,
						user: { externalUserId, roleName: role.name },
					});
					const externalGroups: ExternalGroupDto[] = [firstExternalGroup];

					userService.findByExternalId.mockResolvedValue(user);
					groupService.findGroups.mockResolvedValue(new Page<Group>(existingGroups, 2));
					courseService.findBySyncedGroup.mockResolvedValue([]);
					return {
						externalGroups,
						systemId,
						externalUserId,
						existingGroups,
					};
				};

				it('should delete the group', async () => {
					const { externalGroups, systemId, externalUserId, existingGroups } = setup();

					await service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

					expect(groupService.delete).toHaveBeenCalledWith(existingGroups[1]);
				});

				it('should not save the group', async () => {
					const { externalGroups, systemId, externalUserId } = setup();

					await service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

					expect(groupService.save).not.toHaveBeenCalled();
				});

				it('should not return a group', async () => {
					const { externalGroups, systemId, externalUserId } = setup();

					const result: Group[] = await service.removeExternalGroupsAndAffiliation(
						externalUserId,
						externalGroups,
						systemId
					);

					expect(result).toHaveLength(0);
				});
			});

			describe('when group is empty after removal of the User but synced with a course', () => {
				const setup = () => {
					const systemId = 'systemId';
					const externalUserId = 'externalUserId';
					const role: RoleReference = roleFactory.buildWithId();
					const user: UserDO = userDoFactory.buildWithId({ roles: [role], externalId: externalUserId });
					const course: Course = courseFactory.build();

					const firstExistingGroup: Group = groupFactory.build({
						users: [{ userId: user.id as string, roleId: role.id }],
						externalSource: new ExternalSource({
							externalId: 'externalId-1',
							systemId,
							lastSyncedAt: mockDate,
						}),
					});
					const secondExistingGroup: Group = groupFactory.build({
						users: [{ userId: user.id as string, roleId: role.id }],
						externalSource: new ExternalSource({
							externalId: 'externalId-2',
							systemId,
							lastSyncedAt: mockDate,
						}),
					});
					const existingGroups = [firstExistingGroup, secondExistingGroup];

					const firstExternalGroup: ExternalGroupDto = externalGroupDtoFactory.build({
						externalId: existingGroups[0].externalSource?.externalId,
						user: { externalUserId, roleName: role.name },
					});
					const externalGroups: ExternalGroupDto[] = [firstExternalGroup];

					userService.findByExternalId.mockResolvedValue(user);
					groupService.findGroups.mockResolvedValue(new Page<Group>(existingGroups, 2));
					courseService.findBySyncedGroup.mockResolvedValue([course]);

					return {
						externalGroups,
						systemId,
						externalUserId,
						existingGroups,
					};
				};

				it('should not delete the group', async () => {
					const { externalGroups, systemId, externalUserId } = setup();

					await service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

					expect(groupService.delete).not.toHaveBeenCalled();
				});

				it('should save the group', async () => {
					const { externalGroups, systemId, externalUserId, existingGroups } = setup();

					await service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

					expect(groupService.save).toHaveBeenCalledWith(existingGroups[1]);
				});
			});

			describe('when group is not empty after removal of the User', () => {
				const setup = () => {
					const systemId = 'systemId';
					const externalUserId = 'externalUserId';
					const anotherExternalUserId = 'anotherExternalUserId';
					const role: RoleReference = roleFactory.buildWithId();
					const user: UserDO = userDoFactory.buildWithId({ roles: [role], externalId: externalUserId });
					const anotherUser: UserDO = userDoFactory.buildWithId({ roles: [role], externalId: anotherExternalUserId });

					const firstExistingGroup: Group = groupFactory.build({
						users: [
							{ userId: user.id as string, roleId: role.id },
							{ userId: anotherUser.id as string, roleId: role.id },
						],
						externalSource: new ExternalSource({
							externalId: `externalId-1`,
							systemId,
							lastSyncedAt: mockDate,
						}),
					});

					const secondExistingGroup: Group = groupFactory.build({
						users: [
							{ userId: user.id as string, roleId: role.id },
							{ userId: anotherUser.id as string, roleId: role.id },
						],
						externalSource: new ExternalSource({
							externalId: `externalId-2`,
							systemId,
							lastSyncedAt: mockDate,
						}),
					});

					const existingGroups: Group[] = [firstExistingGroup, secondExistingGroup];

					const firstExternalGroup: ExternalGroupDto = externalGroupDtoFactory.build({
						externalId: existingGroups[0].externalSource?.externalId,
						user: { externalUserId, roleName: role.name },
					});
					const externalGroups: ExternalGroupDto[] = [firstExternalGroup];

					userService.findByExternalId.mockResolvedValueOnce(user);
					groupService.findGroups.mockResolvedValueOnce(new Page<Group>(existingGroups, 2));
					groupService.save.mockResolvedValueOnce(secondExistingGroup);

					return {
						externalGroups,
						systemId,
						externalUserId,
						existingGroups,
						secondExistingGroup,
					};
				};

				it('should save the group', async () => {
					const { externalGroups, systemId, externalUserId, existingGroups } = setup();

					await service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

					expect(groupService.save).toHaveBeenCalledWith(existingGroups[1]);
				});

				it('should not delete the group', async () => {
					const { externalGroups, systemId, externalUserId } = setup();

					await service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

					expect(groupService.delete).not.toHaveBeenCalled();
				});

				it('should return the modified groups', async () => {
					const { externalGroups, systemId, externalUserId, secondExistingGroup } = setup();

					const result: Group[] = await service.removeExternalGroupsAndAffiliation(
						externalUserId,
						externalGroups,
						systemId
					);

					expect(result).toEqual([secondExistingGroup]);
				});
			});
		});

		describe('when user could not be found', () => {
			const setup = () => {
				const systemId = 'systemId';
				const externalUserId = 'externalUserId';
				const externalGroups: ExternalGroupDto[] = [externalGroupDtoFactory.build()];

				userService.findByExternalId.mockResolvedValue(null);

				return {
					systemId,
					externalUserId,
					externalGroups,
				};
			};

			it('should throw NotFoundLoggableException', async () => {
				const { externalGroups, systemId, externalUserId } = setup();

				const func = async () => service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

				await expect(func).rejects.toThrow(new NotFoundLoggableException('User', { externalId: externalUserId }));
			});
		});
	});
});
