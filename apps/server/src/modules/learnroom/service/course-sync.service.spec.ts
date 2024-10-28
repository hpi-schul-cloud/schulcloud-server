import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Group, GroupUser } from '@modules/group';
import { RoleDto, RoleService } from '@modules/role';
import { Test, TestingModule } from '@nestjs/testing';
import { groupFactory, roleDtoFactory } from '@shared/testing';
import {
	Course,
	COURSE_REPO,
	CourseAlreadySynchronizedLoggableException,
	CourseNotSynchronizedLoggableException,
	CourseRepo,
} from '../domain';
import { courseFactory } from '../testing';
import { CourseSyncService } from './course-sync.service';
import { SyncAttribute } from '../../../shared/domain/entity';

describe(CourseSyncService.name, () => {
	let module: TestingModule;
	let service: CourseSyncService;
	let roleService: DeepMocked<RoleService>;

	let courseRepo: DeepMocked<CourseRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseSyncService,
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: COURSE_REPO,
					useValue: createMock<CourseRepo>(),
				},
			],
		}).compile();

		service = module.get(CourseSyncService);
		roleService = module.get(RoleService);
		courseRepo = module.get(COURSE_REPO);
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

			it('should save a course without a synchronized group', async () => {
				const { course } = setup();

				await service.stopSynchronization(course);

				expect(courseRepo.save).toHaveBeenCalledWith(
					new Course({
						...course.getProps(),
						syncedWithGroup: undefined,
						syncExcludedFields: undefined,
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

			it('should throw an unprocessable entity exception', async () => {
				const { course } = setup();

				await expect(service.stopSynchronization(course)).rejects.toThrow(CourseNotSynchronizedLoggableException);
			});
		});
	});

	describe('startSynchronization', () => {
		describe('when a course is not synchronized with a group', () => {
			const setup = () => {
				const teacherId = new ObjectId().toHexString();
				const courseTeacherId = new ObjectId().toHexString();
				const course: Course = courseFactory.build({
					classIds: [new ObjectId().toHexString()],
					groupIds: [new ObjectId().toHexString()],
					substitutionTeacherIds: [teacherId],
					teacherIds: [courseTeacherId],
				});
				const studentRole = roleDtoFactory.build({ id: 'student-role-id' });
				const teacherRole = roleDtoFactory.build({ id: 'teacher-role-id' });
				const students: GroupUser[] = [{ roleId: 'student-role-id', userId: 'student-user-id' }];
				const teachers: GroupUser[] = [{ roleId: 'teacher-role-id', userId: 'teacher-user-id' }];
				const group: Group = groupFactory.build({ users: [...students, ...teachers] });
				const groupWithoutTeachers: Group = groupFactory.build({ users: [...students] });
				roleService.findByName.mockResolvedValueOnce(studentRole).mockResolvedValueOnce(teacherRole);

				return {
					course,
					group,
					students,
					teachers,
					groupWithoutTeachers,
					teacherId,
					courseTeacherId,
				};
			};

			it('should save a course with synchronized group, students, and teachers', async () => {
				const { course, group, students, teachers, teacherId } = setup();

				await service.startSynchronization(course, group);

				expect(courseRepo.saveAll).toHaveBeenCalledWith<[Course[]]>([
					new Course({
						...course.getProps(),
						syncedWithGroup: group.id,
						name: course.name,
						startDate: group.validPeriod?.from,
						untilDate: group.validPeriod?.until,
						studentIds: students.map((student) => student.userId),
						teacherIds: teachers.map((teacher) => teacher.userId),
						classIds: [],
						groupIds: [],
						substitutionTeacherIds: [teacherId],
					}),
				]);
			});

			it('should set an empty list of students if no teachers are present', async () => {
				const { course, groupWithoutTeachers, teacherId } = setup();

				await service.startSynchronization(course, groupWithoutTeachers);

				expect(courseRepo.saveAll).toHaveBeenCalledWith<[Course[]]>([
					new Course({
						...course.getProps(),
						syncedWithGroup: groupWithoutTeachers.id,
						name: course.name,
						startDate: groupWithoutTeachers.validPeriod?.from,
						untilDate: groupWithoutTeachers.validPeriod?.until,
						studentIds: [],
						teacherIds: [],
						classIds: [],
						groupIds: [],
						substitutionTeacherIds: [teacherId],
					}),
				]);
			});
		});

		describe('when a course is not synchronized with a group (partial sync)', () => {
			const setup = () => {
				const teacherId = new ObjectId().toHexString();
				const courseTeacherId = new ObjectId().toHexString();
				const course: Course = courseFactory.build({
					classIds: [new ObjectId().toHexString()],
					groupIds: [new ObjectId().toHexString()],
					substitutionTeacherIds: [teacherId],
					teacherIds: [courseTeacherId],
				});
				const studentRole = roleDtoFactory.build({ id: 'student-role-id' });
				const teacherRole = roleDtoFactory.build({ id: 'teacher-role-id' });
				const students: GroupUser[] = [{ roleId: 'student-role-id', userId: 'student-user-id' }];
				const teachers: GroupUser[] = [{ roleId: 'teacher-role-id', userId: 'teacher-user-id' }];
				const group: Group = groupFactory.build({ users: [...students, ...teachers] });
				const groupWithoutTeachers: Group = groupFactory.build({ users: [...students] });
				roleService.findByName.mockResolvedValueOnce(studentRole).mockResolvedValueOnce(teacherRole);

				return {
					course,
					group,
					students,
					teachers,
					groupWithoutTeachers,
					teacherId,
					courseTeacherId,
				};
			};

			it('should save a course with synchronized group, students, and teachers ', async () => {
				const { course, group, students, teachers, teacherId } = setup();

				await service.startSynchronization(course, group, []);

				expect(courseRepo.saveAll).toHaveBeenCalledWith<[Course[]]>([
					new Course({
						...course.getProps(),
						syncedWithGroup: group.id,
						name: course.name,
						startDate: group.validPeriod?.from,
						untilDate: group.validPeriod?.until,
						studentIds: students.map((student) => student.userId),
						teacherIds: teachers.map((teacher) => teacher.userId),
						classIds: [],
						groupIds: [],
						substitutionTeacherIds: [teacherId],
					}),
				]);
			});

			it('should save a course with synchronized group, students, and not teachers (partial sync)', async () => {
				const { course, group, students, teacherId, courseTeacherId } = setup();

				await service.startSynchronization(course, group, [SyncAttribute.TEACHERS]);

				expect(courseRepo.saveAll).toHaveBeenCalledWith<[Course[]]>([
					new Course({
						...course.getProps(),
						syncedWithGroup: group.id,
						name: course.name,
						startDate: group.validPeriod?.from,
						untilDate: group.validPeriod?.until,
						studentIds: students.map((student) => student.userId),
						teacherIds: [courseTeacherId],
						classIds: [],
						groupIds: [],
						substitutionTeacherIds: [teacherId],
						syncExcludedFields: [SyncAttribute.TEACHERS],
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

				return {
					course,
					group,
					students,
					teachers,
				};
			};

			it('should throw a CourseAlreadySynchronizedLoggableException', async () => {
				const { course, group } = setup();

				await expect(service.startSynchronization(course, group)).rejects.toThrow(
					CourseAlreadySynchronizedLoggableException
				);

				expect(courseRepo.saveAll).not.toHaveBeenCalled();
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
					syncedWithGroup: newGroup.id,
				});

				courseRepo.findBySyncedGroup.mockResolvedValueOnce([new Course(course.getProps())]);
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

			it('should synchronize with the group', async () => {
				const { course, newGroup, studentId, teacherId, substituteTeacherId } = setup();

				await service.synchronizeCourseWithGroup(newGroup);

				expect(courseRepo.saveAll).toHaveBeenCalledWith<[Course[]]>([
					new Course({
						...course.getProps(),
						syncedWithGroup: newGroup.id,
						startDate: newGroup.validPeriod?.from,
						untilDate: newGroup.validPeriod?.until,
						studentIds: [studentId],
						teacherIds: [teacherId],
						classIds: [],
						groupIds: [],
						substitutionTeacherIds: [substituteTeacherId],
					}),
				]);
			});
		});

		describe('when the course name is the same as the old group name', () => {
			const setup = () => {
				const substituteTeacherId = new ObjectId().toHexString();
				const course: Course = courseFactory.build({
					name: 'Course Name',
					classIds: [new ObjectId().toHexString()],
					groupIds: [new ObjectId().toHexString()],
					substitutionTeacherIds: [substituteTeacherId],
				});
				const studentRole: RoleDto = roleDtoFactory.build();
				const teacherRole: RoleDto = roleDtoFactory.build();
				const oldGroup: Group = groupFactory.build({ name: 'Course Name' });
				const newGroup: Group = groupFactory.build({
					name: 'New Group Name',
					users: [],
				});

				courseRepo.findBySyncedGroup.mockResolvedValueOnce([new Course(course.getProps())]);
				roleService.findByName.mockResolvedValueOnce(studentRole);
				roleService.findByName.mockResolvedValueOnce(teacherRole);

				return {
					course,
					newGroup,
					oldGroup,
					substituteTeacherId,
				};
			};

			it('should synchronize the group name', async () => {
				const { course, newGroup, oldGroup, substituteTeacherId } = setup();

				await service.synchronizeCourseWithGroup(newGroup, oldGroup);
				expect(courseRepo.saveAll).toHaveBeenCalledWith<[Course[]]>([
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
						substitutionTeacherIds: [substituteTeacherId],
					}),
				]);
			});
		});

		describe('when the course name is different from the old group name', () => {
			const setup = () => {
				const substituteTeacherId = new ObjectId().toHexString();
				const course: Course = courseFactory.build({
					name: 'Custom Course Name',
					classIds: [new ObjectId().toHexString()],
					groupIds: [new ObjectId().toHexString()],
					substitutionTeacherIds: [substituteTeacherId],
				});
				const studentRole: RoleDto = roleDtoFactory.build();
				const teacherRole: RoleDto = roleDtoFactory.build();
				const oldGroup: Group = groupFactory.build({ name: 'Course Name' });
				const newGroup: Group = groupFactory.build({
					name: 'New Group Name',
					users: [],
				});

				courseRepo.findBySyncedGroup.mockResolvedValueOnce([new Course(course.getProps())]);
				roleService.findByName.mockResolvedValueOnce(studentRole);
				roleService.findByName.mockResolvedValueOnce(teacherRole);

				return {
					course,
					newGroup,
					oldGroup,
					substituteTeacherId,
				};
			};

			it('should keep the old course name', async () => {
				const { course, newGroup, oldGroup, substituteTeacherId } = setup();

				await service.synchronizeCourseWithGroup(newGroup, oldGroup);
				expect(courseRepo.saveAll).toHaveBeenCalledWith<[Course[]]>([
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
						substitutionTeacherIds: [substituteTeacherId],
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
					studentIds: [studentUserId],
					syncedWithGroup: newGroup.id,
					substitutionTeacherIds: [substituteTeacherId],
					syncExcludedFields: [SyncAttribute.TEACHERS],
				});
				courseRepo.findBySyncedGroup.mockResolvedValueOnce([new Course(course.getProps())]);
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
				const { course, newGroup, substituteTeacherId, teacherUserId, studentUserId } = setup();

				await service.synchronizeCourseWithGroup(newGroup, newGroup);
				expect(courseRepo.saveAll).toHaveBeenCalledWith<[Course[]]>([
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
						substitutionTeacherIds: [substituteTeacherId],
					}),
				]);
			});
		});
	});
});
