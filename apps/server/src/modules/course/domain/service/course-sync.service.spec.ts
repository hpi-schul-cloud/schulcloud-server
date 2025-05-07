import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Group, GroupUser } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { RoleDto, RoleName, RoleService } from '@modules/role';
import { roleDtoFactory } from '@modules/role/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { CourseGroupEntity } from '../../repo';
import { courseFactory } from '../../testing';
import { Course } from '../course.do';
import { CourseAlreadySynchronizedLoggableException, CourseNotSynchronizedLoggableException } from '../error';
import { CourseSyncAttribute } from '../interface';
import { CourseDoService } from './course-do.service';
import { CourseSyncService } from './course-sync.service';

describe(CourseSyncService.name, () => {
	let module: TestingModule;
	let service: CourseSyncService;
	let roleService: DeepMocked<RoleService>;

	let courseDoService: DeepMocked<CourseDoService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseSyncService,
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: CourseDoService,
					useValue: createMock<CourseDoService>(),
				},
			],
		}).compile();

		service = module.get(CourseSyncService);
		roleService = module.get(RoleService);
		courseDoService = module.get(CourseDoService);
		await setupEntities([User, Course, CourseGroupEntity]);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('stopSynchronization', () => {
		describe('when a course is synchronized with a group', () => {
			const setup = () => {
				const course: Course = courseFactory.build({ syncedWithGroup: new ObjectId().toHexString() });

				return {
					course,
				};
			};

			it('should stop group sync', async () => {
				const { course } = setup();

				await service.stopSynchronization(course);

				expect(courseDoService.save).toHaveBeenCalledWith(
					new Course({
						...course.getProps(),
						syncedWithGroup: undefined,
						excludeFromSync: undefined,
					})
				);
			});
		});

		describe('when a course is not synchronized with a group', () => {
			const setup = () => {
				const course: Course = courseFactory.build();

				return {
					course,
				};
			};

			it('should throw an exception', async () => {
				const { course } = setup();

				await expect(service.stopSynchronization(course)).rejects.toThrow(CourseNotSynchronizedLoggableException);
			});
		});
	});

	describe('startSynchronization', () => {
		describe('when the starting user is part of the course and the group', () => {
			const setup = () => {
				const syncingUser = userFactory.buildWithId();

				const course: Course = courseFactory.build({
					teacherIds: [syncingUser.id],
					classIds: [new ObjectId().toHexString()],
					groupIds: [new ObjectId().toHexString()],
				});
				const studentRole = roleDtoFactory.build({ name: RoleName.STUDENT });
				const teacherRole = roleDtoFactory.build({ name: RoleName.TEACHER });

				const student = new GroupUser({ roleId: studentRole.id, userId: new ObjectId().toHexString() });
				const teacher = new GroupUser({ roleId: teacherRole.id, userId: syncingUser.id });

				const group: Group = groupFactory.build({ users: [student, teacher] });

				roleService.findByName.mockResolvedValueOnce(teacherRole);
				roleService.findByName.mockResolvedValueOnce(studentRole);
				roleService.findByName.mockResolvedValueOnce(teacherRole);

				return {
					course,
					group,
					student,
					syncingUser,
				};
			};

			it('should start a full synchronization', async () => {
				const { course, group, syncingUser, student } = setup();

				await service.startSynchronization(course, group, syncingUser);

				expect(courseDoService.saveAll).toHaveBeenCalledWith<[Course[]]>([
					new Course({
						...course.getProps(),
						syncedWithGroup: group.id,
						name: course.name,
						startDate: group.validPeriod?.from,
						untilDate: group.validPeriod?.until,
						studentIds: [student.userId],
						teacherIds: [syncingUser.id],
						classIds: [],
						groupIds: [],
						excludeFromSync: undefined,
					}),
				]);
			});
		});

		describe('when the starting user is not part of the course, but every teacher of the course is in the group', () => {
			const setup = () => {
				const syncingUser = userFactory.buildWithId();
				const teacher1Id = new ObjectId().toHexString();
				const teacher2Id = new ObjectId().toHexString();

				const course: Course = courseFactory.build({
					teacherIds: [teacher1Id, teacher2Id],
					classIds: [new ObjectId().toHexString()],
					groupIds: [new ObjectId().toHexString()],
				});
				const studentRole = roleDtoFactory.build({ name: RoleName.STUDENT });
				const teacherRole = roleDtoFactory.build({ name: RoleName.TEACHER });

				const student = new GroupUser({ roleId: studentRole.id, userId: new ObjectId().toHexString() });
				const teacher1 = new GroupUser({ roleId: teacherRole.id, userId: teacher1Id });
				const teacher2 = new GroupUser({ roleId: teacherRole.id, userId: teacher2Id });
				const teacher3 = new GroupUser({ roleId: teacherRole.id, userId: new ObjectId().toHexString() });

				const group: Group = groupFactory.build({ users: [student, teacher1, teacher2, teacher3] });

				roleService.findByName.mockResolvedValueOnce(teacherRole);
				roleService.findByName.mockResolvedValueOnce(studentRole);
				roleService.findByName.mockResolvedValueOnce(teacherRole);

				return {
					course,
					group,
					student,
					teacher1,
					teacher2,
					teacher3,
					syncingUser,
				};
			};

			it('should start a full synchronization', async () => {
				const { course, group, syncingUser, student, teacher1, teacher2, teacher3 } = setup();

				await service.startSynchronization(course, group, syncingUser);

				expect(courseDoService.saveAll).toHaveBeenCalledWith<[Course[]]>([
					new Course({
						...course.getProps(),
						syncedWithGroup: group.id,
						name: course.name,
						startDate: group.validPeriod?.from,
						untilDate: group.validPeriod?.until,
						studentIds: [student.userId],
						teacherIds: [teacher1.userId, teacher2.userId, teacher3.userId],
						classIds: [],
						groupIds: [],
						excludeFromSync: undefined,
					}),
				]);
			});
		});

		describe('when the starting user is not part of the course and not every teacher of the course is in the group', () => {
			const setup = () => {
				const syncingUser = userFactory.buildWithId();
				const teacherId = new ObjectId().toHexString();
				const missingTeacherId = new ObjectId().toHexString();

				const course: Course = courseFactory.build({
					teacherIds: [teacherId, missingTeacherId],
					classIds: [new ObjectId().toHexString()],
					groupIds: [new ObjectId().toHexString()],
				});
				const studentRole = roleDtoFactory.build({ name: RoleName.STUDENT });
				const teacherRole = roleDtoFactory.build({ name: RoleName.TEACHER });

				const student = new GroupUser({ roleId: studentRole.id, userId: new ObjectId().toHexString() });
				const teacher = new GroupUser({ roleId: teacherRole.id, userId: teacherId });

				const group: Group = groupFactory.build({ users: [student, teacher] });

				roleService.findByName.mockResolvedValueOnce(teacherRole);
				roleService.findByName.mockResolvedValueOnce(studentRole);
				roleService.findByName.mockResolvedValueOnce(teacherRole);

				return {
					course,
					group,
					student,
					teacher,
					missingTeacherId,
					syncingUser,
				};
			};

			it('should start a partial synchronization and keep the teachers', async () => {
				const { course, group, syncingUser, student, teacher, missingTeacherId } = setup();

				await service.startSynchronization(course, group, syncingUser);

				expect(courseDoService.saveAll).toHaveBeenCalledWith<[Course[]]>([
					new Course({
						...course.getProps(),
						syncedWithGroup: group.id,
						name: course.name,
						startDate: group.validPeriod?.from,
						untilDate: group.validPeriod?.until,
						studentIds: [student.userId],
						teacherIds: [teacher.userId, missingTeacherId],
						classIds: [],
						groupIds: [],
						excludeFromSync: [CourseSyncAttribute.TEACHERS],
					}),
				]);
			});
		});

		describe('when the starting user is part of the course, but not of the group', () => {
			const setup = () => {
				const syncingUser = userFactory.buildWithId();
				const teacher2Id = new ObjectId().toHexString();

				const course: Course = courseFactory.build({
					teacherIds: [syncingUser.id, teacher2Id],
					classIds: [new ObjectId().toHexString()],
					groupIds: [new ObjectId().toHexString()],
				});
				const studentRole = roleDtoFactory.build({ name: RoleName.STUDENT });
				const teacherRole = roleDtoFactory.build({ name: RoleName.TEACHER });

				const student = new GroupUser({ roleId: studentRole.id, userId: new ObjectId().toHexString() });
				const otherTeacher = new GroupUser({ roleId: teacherRole.id, userId: new ObjectId().toHexString() });

				const group: Group = groupFactory.build({ users: [student, otherTeacher] });

				roleService.findByName.mockResolvedValueOnce(teacherRole);
				roleService.findByName.mockResolvedValueOnce(studentRole);
				roleService.findByName.mockResolvedValueOnce(teacherRole);

				return {
					course,
					group,
					student,
					teacher2Id,
					syncingUser,
				};
			};

			it('should start a partial synchronization and keep the teachers', async () => {
				const { course, group, syncingUser, student, teacher2Id } = setup();

				await service.startSynchronization(course, group, syncingUser);

				expect(courseDoService.saveAll).toHaveBeenCalledWith<[Course[]]>([
					new Course({
						...course.getProps(),
						syncedWithGroup: group.id,
						name: course.name,
						startDate: group.validPeriod?.from,
						untilDate: group.validPeriod?.until,
						studentIds: [student.userId],
						teacherIds: [syncingUser.id, teacher2Id],
						classIds: [],
						groupIds: [],
						excludeFromSync: [CourseSyncAttribute.TEACHERS],
					}),
				]);
			});
		});

		describe('when a course is already synchronized with a group', () => {
			const setup = () => {
				const course: Course = courseFactory.build({ syncedWithGroup: new ObjectId().toHexString() });
				const group: Group = groupFactory.build();
				const students: GroupUser[] = [{ roleId: 'student-role-id', userId: 'student-user-id' }];
				const teachers: GroupUser[] = [{ roleId: 'teacher-role-id', userId: 'teacher-user-id' }];
				const someTeacher = userFactory.build();

				return {
					course,
					group,
					students,
					teachers,
					someTeacher,
				};
			};

			it('should throw an exception', async () => {
				const { course, group, someTeacher } = setup();

				await expect(service.startSynchronization(course, group, someTeacher)).rejects.toThrow(
					CourseAlreadySynchronizedLoggableException
				);

				expect(courseDoService.saveAll).not.toHaveBeenCalled();
			});
		});
	});

	describe('synchronizeCourseWithGroup', () => {
		describe('when synchronizing with a new group', () => {
			const setup = () => {
				const studentId: string = new ObjectId().toHexString();
				const teacherId: string = new ObjectId().toHexString();
				const studentRoleId: string = new ObjectId().toHexString();
				const teacherRoleId: string = new ObjectId().toHexString();
				const studentRole: RoleDto = roleDtoFactory.build({ id: studentRoleId });
				const teacherRole: RoleDto = roleDtoFactory.build({ id: teacherRoleId });
				const newGroup: Group = groupFactory.build({
					users: [
						{
							userId: studentId,
							roleId: studentRoleId,
						},
						{
							userId: teacherId,
							roleId: teacherRoleId,
						},
					],
				});
				const substituteTeacherId = new ObjectId().toHexString();
				const course: Course = courseFactory.build({
					classIds: [new ObjectId().toHexString()],
					groupIds: [new ObjectId().toHexString()],
					substitutionTeacherIds: [substituteTeacherId],
				});

				courseDoService.findBySyncedGroup.mockResolvedValueOnce([new Course(course.getProps())]);
				roleService.findByName.mockResolvedValueOnce(studentRole);
				roleService.findByName.mockResolvedValueOnce(teacherRole);

				return {
					course,
					newGroup,
					studentId,
					teacherId,
					substituteTeacherId,
				};
			};

			it('should synchronize with the new group', async () => {
				const { course, newGroup, studentId, teacherId } = setup();

				await service.synchronizeCourseWithGroup(newGroup);

				expect(courseDoService.saveAll).toHaveBeenCalledWith<[Course[]]>([
					new Course({
						...course.getProps(),
						syncedWithGroup: newGroup.id,
						startDate: newGroup.validPeriod?.from,
						untilDate: newGroup.validPeriod?.until,
						studentIds: [studentId],
						teacherIds: [teacherId],
						substitutionTeacherIds: [],
						classIds: [],
						groupIds: [],
					}),
				]);
			});
		});

		describe('when synchronizing with a new group with substitute teacher', () => {
			const setup = () => {
				const studentId: string = new ObjectId().toHexString();
				const teacherId: string = new ObjectId().toHexString();
				const substituteTeacherId: string = new ObjectId().toHexString();
				const studentRoleId: string = new ObjectId().toHexString();
				const teacherRoleId: string = new ObjectId().toHexString();
				const substituteTeacherRoleId: string = new ObjectId().toHexString();
				const studentRole: RoleDto = roleDtoFactory.build({ id: studentRoleId });
				const teacherRole: RoleDto = roleDtoFactory.build({ id: teacherRoleId });
				const substituteTeacherRole: RoleDto = roleDtoFactory.build({ id: substituteTeacherRoleId });
				const newGroup: Group = groupFactory.build({
					users: [
						{
							userId: studentId,
							roleId: studentRoleId,
						},
						{
							userId: teacherId,
							roleId: teacherRoleId,
						},
						{
							userId: substituteTeacherId,
							roleId: substituteTeacherRoleId,
						},
						{
							userId: teacherId,
							roleId: substituteTeacherRoleId,
						},
					],
				});
				const course: Course = courseFactory.build({
					classIds: [new ObjectId().toHexString()],
					groupIds: [new ObjectId().toHexString()],
					substitutionTeacherIds: [],
				});

				courseDoService.findBySyncedGroup.mockResolvedValueOnce([new Course(course.getProps())]);
				roleService.findByName
					.mockResolvedValueOnce(studentRole)
					.mockResolvedValueOnce(teacherRole)
					.mockResolvedValueOnce(substituteTeacherRole);

				return {
					course,
					newGroup,
					studentId,
					teacherId,
					substituteTeacherId,
				};
			};

			it('should synchronize the substitution teachers, without creating duplicates in teacherIds', async () => {
				const { course, newGroup, studentId, teacherId, substituteTeacherId } = setup();

				await service.synchronizeCourseWithGroup(newGroup);

				expect(courseDoService.saveAll).toHaveBeenCalledWith<[Course[]]>([
					new Course({
						...course.getProps(),
						syncedWithGroup: newGroup.id,
						startDate: newGroup.validPeriod?.from,
						untilDate: newGroup.validPeriod?.until,
						studentIds: [studentId],
						teacherIds: [teacherId],
						substitutionTeacherIds: [substituteTeacherId],
						classIds: [],
						groupIds: [],
					}),
				]);
			});
		});

		describe('when the course name is the same as the old group name', () => {
			const setup = () => {
				const course: Course = courseFactory.build({
					name: 'Course Name',
					classIds: [new ObjectId().toHexString()],
					groupIds: [new ObjectId().toHexString()],
				});
				const studentRole: RoleDto = roleDtoFactory.build();
				const teacherRole: RoleDto = roleDtoFactory.build();
				const oldGroup: Group = groupFactory.build({ name: 'Course Name' });
				const newGroup: Group = groupFactory.build({
					name: 'New Group Name',
					users: [],
				});

				courseDoService.findBySyncedGroup.mockResolvedValueOnce([new Course(course.getProps())]);
				roleService.findByName.mockResolvedValueOnce(studentRole);
				roleService.findByName.mockResolvedValueOnce(teacherRole);

				return {
					course,
					newGroup,
					oldGroup,
				};
			};

			it('should synchronize the group name', async () => {
				const { course, newGroup, oldGroup } = setup();

				await service.synchronizeCourseWithGroup(newGroup, oldGroup);
				expect(courseDoService.saveAll).toHaveBeenCalledWith<[Course[]]>([
					new Course({
						...course.getProps(),
						name: newGroup.name,
						syncedWithGroup: newGroup.id,
						startDate: newGroup.validPeriod?.from,
						untilDate: newGroup.validPeriod?.until,
						studentIds: [],
						teacherIds: [],
						classIds: [],
						groupIds: [],
						substitutionTeacherIds: [],
					}),
				]);
			});
		});

		describe('when the course name is different from the old group name', () => {
			const setup = () => {
				const course: Course = courseFactory.build({
					name: 'Custom Course Name',
					classIds: [new ObjectId().toHexString()],
					groupIds: [new ObjectId().toHexString()],
				});
				const studentRole: RoleDto = roleDtoFactory.build();
				const teacherRole: RoleDto = roleDtoFactory.build();
				const oldGroup: Group = groupFactory.build({ name: 'Course Name' });
				const newGroup: Group = groupFactory.build({
					name: 'New Group Name',
					users: [],
				});

				courseDoService.findBySyncedGroup.mockResolvedValueOnce([new Course(course.getProps())]);
				roleService.findByName.mockResolvedValueOnce(studentRole);
				roleService.findByName.mockResolvedValueOnce(teacherRole);

				return {
					course,
					newGroup,
					oldGroup,
				};
			};

			it('should keep the old course name', async () => {
				const { course, newGroup, oldGroup } = setup();

				await service.synchronizeCourseWithGroup(newGroup, oldGroup);
				expect(courseDoService.saveAll).toHaveBeenCalledWith<[Course[]]>([
					new Course({
						...course.getProps(),
						name: course.name,
						syncedWithGroup: newGroup.id,
						startDate: newGroup.validPeriod?.from,
						untilDate: newGroup.validPeriod?.until,
						studentIds: [],
						teacherIds: [],
						classIds: [],
						groupIds: [],
						substitutionTeacherIds: [],
					}),
				]);
			});
		});

		describe('when the teachers are not synced from group', () => {
			const setup = () => {
				const studentUserId = new ObjectId().toHexString();
				const teacherUserId = new ObjectId().toHexString();
				const studentRoleId: string = new ObjectId().toHexString();
				const studentRole: RoleDto = roleDtoFactory.build({ id: studentRoleId });
				const teacherRole: RoleDto = roleDtoFactory.build();

				const newGroup: Group = groupFactory.build({
					users: [
						new GroupUser({
							userId: studentUserId,
							roleId: studentRoleId,
						}),
					],
				});

				const course: Course = courseFactory.build({
					syncedWithGroup: newGroup.id,
					teacherIds: [teacherUserId],
					excludeFromSync: [],
				});
				courseDoService.findBySyncedGroup.mockResolvedValueOnce([new Course(course.getProps())]);
				roleService.findByName.mockResolvedValueOnce(studentRole);
				roleService.findByName.mockResolvedValueOnce(teacherRole);

				return {
					course,
					newGroup,
					teacherUserId,
					studentUserId,
				};
			};

			it('should not sync group students', async () => {
				const { course, newGroup, teacherUserId } = setup();

				await service.synchronizeCourseWithGroup(newGroup);
				expect(courseDoService.saveAll).toHaveBeenCalledWith<[Course[]]>([
					new Course({
						...course.getProps(),
						name: course.name,
						startDate: newGroup.validPeriod?.from,
						untilDate: newGroup.validPeriod?.until,
						studentIds: [],
						teacherIds: [teacherUserId],
						syncedWithGroup: course.syncedWithGroup,
						classIds: [],
						groupIds: [],
						excludeFromSync: [],
						substitutionTeacherIds: [],
					}),
				]);
			});
		});

		describe('when the teachers are not synced from group (partial sync)', () => {
			const setup = () => {
				const substituteTeacherId = new ObjectId().toHexString();
				const studentUserId = new ObjectId().toHexString();
				const teacherUserId = new ObjectId().toHexString();
				const studentRoleId: string = new ObjectId().toHexString();
				const studentRole: RoleDto = roleDtoFactory.build({ id: studentRoleId });
				const teacherRole: RoleDto = roleDtoFactory.build();
				const teacherRoleId: string = new ObjectId().toHexString();
				const newGroup: Group = groupFactory.build({
					users: [
						new GroupUser({
							userId: studentUserId,
							roleId: studentRoleId,
						}),
						new GroupUser({
							userId: substituteTeacherId,
							roleId: teacherRoleId,
						}),
					],
				});

				const course: Course = courseFactory.build({
					teacherIds: [teacherUserId],
					syncedWithGroup: newGroup.id,
					substitutionTeacherIds: [substituteTeacherId],
					excludeFromSync: [CourseSyncAttribute.TEACHERS],
				});
				courseDoService.findBySyncedGroup.mockResolvedValueOnce([new Course(course.getProps())]);
				roleService.findByName.mockResolvedValueOnce(studentRole);
				roleService.findByName.mockResolvedValueOnce(teacherRole);

				return {
					course,
					newGroup,
					teacherUserId,
					substituteTeacherId,
					studentUserId,
				};
			};

			it('should not sync group teachers', async () => {
				const { course, newGroup, teacherUserId, studentUserId } = setup();

				await service.synchronizeCourseWithGroup(newGroup);
				expect(courseDoService.saveAll).toHaveBeenCalledWith<[Course[]]>([
					new Course({
						...course.getProps(),
						name: course.name,
						startDate: newGroup.validPeriod?.from,
						untilDate: newGroup.validPeriod?.until,
						studentIds: [studentUserId],
						teacherIds: [teacherUserId],
						syncedWithGroup: course.syncedWithGroup,
						classIds: [],
						groupIds: [],
						excludeFromSync: [CourseSyncAttribute.TEACHERS],
						substitutionTeacherIds: [],
					}),
				]);
			});
		});
	});

	describe('synchronize', () => {
		describe('when synchronizing with a new group', () => {
			const setup = () => {
				const studentId: string = new ObjectId().toHexString();
				const teacherId: string = new ObjectId().toHexString();
				const studentRoleId: string = new ObjectId().toHexString();
				const teacherRoleId: string = new ObjectId().toHexString();
				const studentRole: RoleDto = roleDtoFactory.build({ id: studentRoleId });
				const teacherRole: RoleDto = roleDtoFactory.build({ id: teacherRoleId });
				const newGroup: Group = groupFactory.build({
					users: [
						{
							userId: studentId,
							roleId: studentRoleId,
						},
						{
							userId: teacherId,
							roleId: teacherRoleId,
						},
					],
				});
				const substituteTeacherId = new ObjectId().toHexString();
				const courses: Course[] = courseFactory.buildList(3, {
					classIds: [new ObjectId().toHexString()],
					groupIds: [new ObjectId().toHexString()],
					substitutionTeacherIds: [substituteTeacherId],
				});

				roleService.findByName.mockResolvedValueOnce(studentRole);
				roleService.findByName.mockResolvedValueOnce(teacherRole);

				const expectedCoursesAfterSync = courses.map((course: Course) =>
					courseFactory.build({
						...course.getProps(),
						syncedWithGroup: newGroup.id,
						startDate: newGroup.validPeriod?.from,
						untilDate: newGroup.validPeriod?.until,
						studentIds: [studentId],
						teacherIds: [teacherId],
						substitutionTeacherIds: [],
						classIds: [],
						groupIds: [],
					})
				);

				return {
					courses,
					newGroup,
					expectedCoursesAfterSync,
				};
			};

			it('should synchronize with the new group', async () => {
				const { courses, newGroup, expectedCoursesAfterSync } = setup();

				await service.synchronize(courses, newGroup);

				expect(courseDoService.saveAll).toHaveBeenCalledWith(expect.arrayContaining(expectedCoursesAfterSync));
			});
		});

		describe('when synchronizing with a new group with substitute teacher', () => {
			const setup = () => {
				const studentId: string = new ObjectId().toHexString();
				const teacherId: string = new ObjectId().toHexString();
				const substituteTeacherId: string = new ObjectId().toHexString();
				const studentRoleId: string = new ObjectId().toHexString();
				const teacherRoleId: string = new ObjectId().toHexString();
				const substituteTeacherRoleId: string = new ObjectId().toHexString();
				const studentRole: RoleDto = roleDtoFactory.build({ id: studentRoleId });
				const teacherRole: RoleDto = roleDtoFactory.build({ id: teacherRoleId });
				const substituteTeacherRole: RoleDto = roleDtoFactory.build({ id: substituteTeacherRoleId });
				const newGroup: Group = groupFactory.build({
					users: [
						{
							userId: studentId,
							roleId: studentRoleId,
						},
						{
							userId: teacherId,
							roleId: teacherRoleId,
						},
						{
							userId: substituteTeacherId,
							roleId: substituteTeacherRoleId,
						},
						{
							userId: teacherId,
							roleId: substituteTeacherRoleId,
						},
					],
				});
				const course: Course = courseFactory.build({
					classIds: [new ObjectId().toHexString()],
					groupIds: [new ObjectId().toHexString()],
					substitutionTeacherIds: [],
				});

				roleService.findByName
					.mockResolvedValueOnce(studentRole)
					.mockResolvedValueOnce(teacherRole)
					.mockResolvedValueOnce(substituteTeacherRole);

				const expectedCourseAfterSync = courseFactory.build({
					...course.getProps(),
					syncedWithGroup: newGroup.id,
					startDate: newGroup.validPeriod?.from,
					untilDate: newGroup.validPeriod?.until,
					studentIds: [studentId],
					teacherIds: [teacherId],
					substitutionTeacherIds: [substituteTeacherId],
					classIds: [],
					groupIds: [],
				});

				return {
					course,
					newGroup,
					expectedCourseAfterSync,
				};
			};

			it('should synchronize the substitution teachers, without creating duplicates in teacherIds', async () => {
				const { course, newGroup, expectedCourseAfterSync } = setup();

				await service.synchronize([course], newGroup);

				expect(courseDoService.saveAll).toHaveBeenCalledWith([expectedCourseAfterSync]);
			});
		});

		describe('when the course name is the same as the old group name', () => {
			const setup = () => {
				const course: Course = courseFactory.build({
					name: 'Course Name',
					classIds: [new ObjectId().toHexString()],
					groupIds: [new ObjectId().toHexString()],
				});
				const studentRole: RoleDto = roleDtoFactory.build();
				const teacherRole: RoleDto = roleDtoFactory.build();
				const oldGroup: Group = groupFactory.build({ name: 'Course Name' });
				const newGroup: Group = groupFactory.build({
					name: 'New Group Name',
					users: [],
				});

				roleService.findByName.mockResolvedValueOnce(studentRole);
				roleService.findByName.mockResolvedValueOnce(teacherRole);

				const expectedCourseAfterSync = courseFactory.build({
					...course.getProps(),
					name: newGroup.name,
					syncedWithGroup: newGroup.id,
					startDate: newGroup.validPeriod?.from,
					untilDate: newGroup.validPeriod?.until,
					studentIds: [],
					teacherIds: [],
					classIds: [],
					groupIds: [],
					substitutionTeacherIds: [],
				});

				return {
					course,
					newGroup,
					oldGroup,
					expectedCourseAfterSync,
				};
			};

			it('should synchronize the group name', async () => {
				const { course, newGroup, oldGroup, expectedCourseAfterSync } = setup();

				await service.synchronize([course], newGroup, oldGroup);
				expect(courseDoService.saveAll).toHaveBeenCalledWith([expectedCourseAfterSync]);
			});
		});

		describe('when the course name is different from the old group name', () => {
			const setup = () => {
				const course: Course = courseFactory.build({
					name: 'Custom Course Name',
					classIds: [new ObjectId().toHexString()],
					groupIds: [new ObjectId().toHexString()],
				});
				const studentRole: RoleDto = roleDtoFactory.build();
				const teacherRole: RoleDto = roleDtoFactory.build();
				const oldGroup: Group = groupFactory.build({ name: 'Course Name' });
				const newGroup: Group = groupFactory.build({
					name: 'New Group Name',
					users: [],
				});

				roleService.findByName.mockResolvedValueOnce(studentRole);
				roleService.findByName.mockResolvedValueOnce(teacherRole);

				const expectedCourseAfterSync = courseFactory.build({
					...course.getProps(),
					name: course.name,
					syncedWithGroup: newGroup.id,
					startDate: newGroup.validPeriod?.from,
					untilDate: newGroup.validPeriod?.until,
					studentIds: [],
					teacherIds: [],
					classIds: [],
					groupIds: [],
					substitutionTeacherIds: [],
				});

				return {
					course,
					newGroup,
					oldGroup,
					expectedCourseAfterSync,
				};
			};

			it('should keep the old course name', async () => {
				const { course, newGroup, oldGroup, expectedCourseAfterSync } = setup();

				await service.synchronize([course], newGroup, oldGroup);
				expect(courseDoService.saveAll).toHaveBeenCalledWith([expectedCourseAfterSync]);
			});
		});

		describe('when the teachers are not part of the group', () => {
			const setup = () => {
				const studentUserId = new ObjectId().toHexString();
				const teacherUserId = new ObjectId().toHexString();
				const studentRoleId: string = new ObjectId().toHexString();
				const studentRole: RoleDto = roleDtoFactory.build({ id: studentRoleId });
				const teacherRole: RoleDto = roleDtoFactory.build();

				const newGroup: Group = groupFactory.build({
					users: [
						new GroupUser({
							userId: studentUserId,
							roleId: studentRoleId,
						}),
					],
				});

				const course: Course = courseFactory.build({
					syncedWithGroup: newGroup.id,
					teacherIds: [teacherUserId],
					excludeFromSync: [],
				});

				roleService.findByName.mockResolvedValueOnce(studentRole);
				roleService.findByName.mockResolvedValueOnce(teacherRole);

				const expectedCourseAfterSync = courseFactory.build({
					...course.getProps(),
					name: course.name,
					startDate: newGroup.validPeriod?.from,
					untilDate: newGroup.validPeriod?.until,
					studentIds: [],
					teacherIds: [teacherUserId],
					syncedWithGroup: course.syncedWithGroup,
					classIds: [],
					groupIds: [],
					excludeFromSync: [],
					substitutionTeacherIds: [],
				});

				return {
					course,
					newGroup,
					expectedCourseAfterSync,
				};
			};

			it('should not sync group students', async () => {
				const { course, newGroup, expectedCourseAfterSync } = setup();

				await service.synchronize([course], newGroup);

				expect(courseDoService.saveAll).toHaveBeenCalledWith([expectedCourseAfterSync]);
			});
		});

		describe('when the teachers are not part of the group and are excluded from the sync (partial sync)', () => {
			const setup = () => {
				const substituteTeacherId = new ObjectId().toHexString();
				const studentUserId = new ObjectId().toHexString();
				const teacherUserId = new ObjectId().toHexString();
				const studentRoleId: string = new ObjectId().toHexString();
				const studentRole: RoleDto = roleDtoFactory.build({ id: studentRoleId });
				const teacherRole: RoleDto = roleDtoFactory.build();
				const teacherRoleId: string = new ObjectId().toHexString();
				const newGroup: Group = groupFactory.build({
					users: [
						new GroupUser({
							userId: studentUserId,
							roleId: studentRoleId,
						}),
						new GroupUser({
							userId: substituteTeacherId,
							roleId: teacherRoleId,
						}),
					],
				});

				const course: Course = courseFactory.build({
					teacherIds: [teacherUserId],
					syncedWithGroup: newGroup.id,
					substitutionTeacherIds: [substituteTeacherId],
					excludeFromSync: [CourseSyncAttribute.TEACHERS],
				});

				roleService.findByName.mockResolvedValueOnce(studentRole);
				roleService.findByName.mockResolvedValueOnce(teacherRole);

				const expectedCourseAfterSync = courseFactory.build({
					...course.getProps(),
					name: course.name,
					startDate: newGroup.validPeriod?.from,
					untilDate: newGroup.validPeriod?.until,
					studentIds: [studentUserId],
					teacherIds: [teacherUserId],
					syncedWithGroup: course.syncedWithGroup,
					classIds: [],
					groupIds: [],
					excludeFromSync: [CourseSyncAttribute.TEACHERS],
					substitutionTeacherIds: [],
				});

				return {
					course,
					newGroup,
					expectedCourseAfterSync,
				};
			};

			it('should not sync group teachers', async () => {
				const { course, newGroup, expectedCourseAfterSync } = setup();

				await service.synchronize([course], newGroup);

				expect(courseDoService.saveAll).toHaveBeenCalledWith([expectedCourseAfterSync]);
			});
		});
	});

	describe('stopSynchronizations', () => {
		describe('when a list of synchronized courses is passed', () => {
			const setup = () => {
				const courses: Course[] = courseFactory.buildList(5, { syncedWithGroup: new ObjectId().toHexString() });

				const expectedSavedCourses: Course[] = courses.map((course: Course) =>
					courseFactory.build({
						...course.getProps(),
						syncedWithGroup: undefined,
						excludeFromSync: undefined,
					})
				);

				return {
					courses,
					expectedSavedCourses,
				};
			};

			it('should stop the sync of the courses', async () => {
				const { courses, expectedSavedCourses } = setup();

				await service.stopSynchronizations(courses);

				expect(courseDoService.saveAll).toHaveBeenCalledWith(expect.arrayContaining(expectedSavedCourses));
			});
		});
	});
});
