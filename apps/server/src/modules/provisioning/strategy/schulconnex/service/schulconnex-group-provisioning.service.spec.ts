import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { CourseDoService } from '@modules/course';
import { courseFactory } from '@modules/course/testing';
import { Group, GroupService, GroupTypes } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import {
	LegacySchoolService,
	SchoolSystemOptionsService,
	SchulConneXProvisioningOptions,
} from '@modules/legacy-school';
import { legacySchoolDoFactory } from '@modules/legacy-school/testing';
import { externalGroupDtoFactory, externalSchoolDtoFactory } from '@modules/provisioning/testing';
import { RoleName, RoleService } from '@modules/role';
import { roleDtoFactory, roleFactory } from '@modules/role/testing';
import { UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { SchoolForGroupNotFoundLoggable, UserForGroupNotFoundLoggable } from '../../../loggable';
import { SchulconnexCourseSyncService } from './schulconnex-course-sync.service';
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
	let schulconnexCourseSyncService: DeepMocked<SchulconnexCourseSyncService>;
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
					provide: SchulconnexCourseSyncService,
					useValue: createMock<SchulconnexCourseSyncService>(),
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
		schulconnexCourseSyncService = module.get(SchulconnexCourseSyncService);

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
				const schoolId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();

				const classGroup = externalGroupDtoFactory.build({
					type: GroupTypes.CLASS,
				});
				const courseGroup = externalGroupDtoFactory.build({
					type: GroupTypes.COURSE,
				});
				const otherGroup = externalGroupDtoFactory.build({
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
				const schoolId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();

				const classGroup = externalGroupDtoFactory.build({
					type: GroupTypes.CLASS,
				});
				const courseGroup = externalGroupDtoFactory.build({
					type: GroupTypes.COURSE,
				});
				const otherGroup = externalGroupDtoFactory.build({
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
				const schoolId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();

				const classGroup = externalGroupDtoFactory.build({
					type: GroupTypes.CLASS,
				});
				const courseGroup = externalGroupDtoFactory.build({
					type: GroupTypes.COURSE,
				});
				const otherGroup = externalGroupDtoFactory.build({
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
				const schoolId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();

				const classGroup = externalGroupDtoFactory.build({
					type: GroupTypes.CLASS,
				});
				const courseGroup = externalGroupDtoFactory.build({
					type: GroupTypes.COURSE,
				});
				const otherGroup = externalGroupDtoFactory.build({
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
				const systemId = new ObjectId().toHexString();

				const classGroup = externalGroupDtoFactory.build({
					type: GroupTypes.CLASS,
				});
				const courseGroup = externalGroupDtoFactory.build({
					type: GroupTypes.COURSE,
				});
				const otherGroup = externalGroupDtoFactory.build({
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
				const externalGroupDto = externalGroupDtoFactory.build();
				const externalSchoolDto = externalSchoolDtoFactory.build();
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
				const externalGroupDto = externalGroupDtoFactory.build({ otherUsers: undefined });
				const systemId = 'systemId';
				const school = legacySchoolDoFactory.buildWithId();

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
				const school = legacySchoolDoFactory.build({ id: 'schoolId' });
				const student = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }])
					.build({ id: new ObjectId().toHexString(), externalId: 'studentExternalId' });
				const teacher = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.TEACHER }])
					.build({ id: new ObjectId().toHexString(), externalId: 'teacherExternalId' });
				const studentRole = roleDtoFactory.build({ name: RoleName.STUDENT });
				const teacherRole = roleDtoFactory.build({ name: RoleName.TEACHER });
				const externalSchoolDto = externalSchoolDtoFactory.build();
				const externalGroupDto = externalGroupDtoFactory.build({
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

				const result = await service.provisionExternalGroup(externalGroupDto, externalSchoolDto, systemId);

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
				const student = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }])
					.build({ id: new ObjectId().toHexString(), externalId: 'studentExternalId' });
				const teacherId = new ObjectId().toHexString();
				const teacherRoleId = new ObjectId().toHexString();
				const teacher = userDoFactory
					.withRoles([{ id: teacherRoleId, name: RoleName.TEACHER }])
					.build({ id: teacherId, externalId: 'teacherExternalId' });
				const studentRole = roleDtoFactory.build({ name: RoleName.STUDENT });
				const teacherRole = roleDtoFactory.build({ id: teacherRoleId, name: RoleName.TEACHER });
				const externalGroupDto = externalGroupDtoFactory.build({
					user: {
						externalUserId: student.externalId as string,
						roleName: RoleName.STUDENT,
					},
					otherUsers: undefined,
				});
				const group = groupFactory.build({ users: [{ userId: teacherId, roleId: teacherRoleId }] });
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
				const student = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }])
					.build({ id: new ObjectId().toHexString(), externalId: 'studentExternalId' });
				const teacherId = new ObjectId().toHexString();
				const teacherRoleId = new ObjectId().toHexString();
				const teacher = userDoFactory
					.withRoles([{ id: teacherRoleId, name: RoleName.TEACHER }])
					.build({ id: teacherId, externalId: 'teacherExternalId' });
				const studentRole = roleDtoFactory.build({ name: RoleName.STUDENT });
				const teacherRole = roleDtoFactory.build({ id: teacherRoleId, name: RoleName.TEACHER });
				const externalGroupDto = externalGroupDtoFactory.build({
					user: {
						externalUserId: student.externalId as string,
						roleName: RoleName.STUDENT,
					},
					otherUsers: [],
				});
				const group = groupFactory.build({ users: [{ userId: teacherId, roleId: teacherRoleId }] });
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

	describe('removeUserFromGroup', () => {
		describe('when group is empty after removing the user', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const role = roleFactory.buildWithId();

				const group = groupFactory.build({
					users: [{ userId, roleId: role.id }],
				});

				groupService.findById.mockResolvedValueOnce(group);
				courseService.findBySyncedGroup.mockResolvedValueOnce([]);

				return {
					group,
					userId,
				};
			};

			it('should delete the group', async () => {
				const { group, userId } = setup();

				await service.removeUserFromGroup(userId, group.id);

				expect(groupService.delete).toHaveBeenCalledWith(
					new Group({
						...group.getProps(),
						users: [],
					})
				);
			});

			it('should return null', async () => {
				const { group, userId } = setup();

				const result = await service.removeUserFromGroup(userId, group.id);

				expect(result).toBeNull();
			});
		});

		describe('when group is empty after removing the user, but synchronized courses are attached', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const role = roleFactory.buildWithId();

				const group = groupFactory.build({
					users: [{ userId, roleId: role.id }],
				});
				const courses = courseFactory.buildList(3, { syncedWithGroup: group.id });

				groupService.findById.mockResolvedValueOnce(group);
				courseService.findBySyncedGroup.mockResolvedValueOnce(courses);
				groupService.save.mockResolvedValueOnce(group);

				return {
					group,
					courses,
					userId,
				};
			};

			it('should desync the courses and create a history for each course', async () => {
				const { group, courses, userId } = setup();

				await service.removeUserFromGroup(userId, group.id);

				expect(schulconnexCourseSyncService.desyncCoursesAndCreateHistories).toBeCalledWith(group, courses);
			});

			it('should delete the empty group', async () => {
				const { group, userId } = setup();

				await service.removeUserFromGroup(userId, group.id);

				expect(groupService.delete).toBeCalledWith(group);
			});
		});

		describe('when group is not empty after removing the user', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const otherUserId = new ObjectId().toHexString();
				const role = roleFactory.buildWithId();

				const group = groupFactory.build({
					users: [
						{ userId, roleId: role.id },
						{ userId: otherUserId, roleId: role.id },
					],
				});

				groupService.findById.mockResolvedValueOnce(group);
				groupService.save.mockResolvedValueOnce(group);

				return {
					group,
					role,
					userId,
					otherUserId,
				};
			};

			it('should not delete the group', async () => {
				const { group, userId } = setup();

				await service.removeUserFromGroup(userId, group.id);

				expect(groupService.delete).not.toHaveBeenCalled();
			});

			it('should save the group with the other users remaining', async () => {
				const { group, userId, role, otherUserId } = setup();

				await service.removeUserFromGroup(userId, group.id);

				expect(groupService.save).toHaveBeenCalledWith(
					new Group({
						...group.getProps(),
						users: [{ userId: otherUserId, roleId: role.id }],
					})
				);
			});

			it('should return the group', async () => {
				const { group, userId } = setup();

				const result = await service.removeUserFromGroup(userId, group.id);

				expect(result).toEqual(group);
			});
		});

		describe('when the user is not part of the group', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const role = roleFactory.buildWithId();

				const group = groupFactory.build({
					users: [{ userId: new ObjectId().toHexString(), roleId: role.id }],
				});

				groupService.findById.mockResolvedValueOnce(group);

				return {
					group,
					userId,
				};
			};

			it('should modify the group', async () => {
				const { group, userId } = setup();

				await service.removeUserFromGroup(userId, group.id);

				expect(groupService.save).not.toHaveBeenCalled();
				expect(groupService.delete).not.toHaveBeenCalled();
			});

			it('should return null', async () => {
				const { group, userId } = setup();

				const result = await service.removeUserFromGroup(userId, group.id);

				expect(result).toBeNull();
			});
		});
	});
});
