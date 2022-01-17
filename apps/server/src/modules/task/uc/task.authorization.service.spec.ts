import { Test, TestingModule } from '@nestjs/testing';
import { CourseRepo, LessonRepo } from '@shared/repo';
import { taskFactory, courseFactory, userFactory, roleFactory, setupEntities } from '@shared/testing';
import { Course, Lesson, PermissionService } from '@shared/domain';

import { MikroORM } from '@mikro-orm/core';
import { TaskAuthorizationService, TaskDashBoardPermission, TaskParentPermission } from './task.authorization.service';

describe('task.authorization.service', () => {
	let module: TestingModule;
	let service: TaskAuthorizationService;
	let courseRepo: CourseRepo;
	let lessonRepo: LessonRepo;
	let permissionService: PermissionService;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				TaskAuthorizationService,
				{
					provide: LessonRepo,
					useValue: {
						findAllByCourseIds() {
							throw new Error('Please write a mock for LessonRepo.findAllByCourseIds');
						},
					},
				},
				{
					provide: CourseRepo,
					useValue: {
						findAllForTeacher() {
							throw new Error('Please write a mock for TaskRepo.findAllForTeacher');
						},
						findAllByUserId() {
							throw new Error('Please write a mock for TaskRepo.findAllByUserId');
						},
					},
				},
				{
					provide: PermissionService,
					useValue: {
						resolveRolesAndPermissions() {
							throw new Error('Please write a mock for PermissionService.resolveRolesAndPermissions');
						},
					},
				},
			],
		}).compile();

		service = module.get(TaskAuthorizationService);
		courseRepo = module.get(CourseRepo);
		lessonRepo = module.get(LessonRepo);
		permissionService = module.get(PermissionService);
	});

	const setCourseRepoMock = {
		findAllForTeacher: (courses: Course[] = []) => {
			const spy = jest
				.spyOn(courseRepo, 'findAllForTeacher')
				.mockImplementation(() => Promise.resolve([courses, courses.length]));

			return spy;
		},
		findAllByUserId: (courses: Course[] = []) => {
			const spy = jest
				.spyOn(courseRepo, 'findAllByUserId')
				.mockImplementation(() => Promise.resolve([courses, courses.length]));

			return spy;
		},
	};

	const setLessonRepoMock = {
		findAllByCourseIds: (lessons: Lesson[] = []) => {
			const spy = jest
				.spyOn(lessonRepo, 'findAllByCourseIds')
				.mockImplementation(() => Promise.resolve([lessons, lessons.length]));

			return spy;
		},
	};

	describe('getPermittedCourses', () => {
		describe('when checking for read permission', () => {
			it('should return all courses where the user is assigned as a student', async () => {
				const user = userFactory.build();
				const courses = courseFactory.buildList(3);

				const spy1 = setCourseRepoMock.findAllForTeacher([]);
				const spy2 = setCourseRepoMock.findAllByUserId(courses);

				const result = await service.getPermittedCourses(user, TaskParentPermission.read);

				expect(result).toEqual(courses);

				spy1.mockRestore();
				spy2.mockRestore();
			});

			it('should return no courses where the user is assigned as a teacher or substitution teacher', async () => {
				const user = userFactory.build();
				const courses = courseFactory.buildList(3);

				const spy1 = setCourseRepoMock.findAllForTeacher(courses);
				const spy2 = setCourseRepoMock.findAllByUserId([]);

				const result = await service.getPermittedCourses(user, TaskParentPermission.read);

				expect(result).toEqual([]);

				spy1.mockRestore();
				spy2.mockRestore();
			});
		});
		describe('when checking for write permission', () => {
			it('should return all courses where the user is assigned as a teacher or substitution teacher', async () => {
				const user = userFactory.build();
				const courses = courseFactory.buildList(3);

				const spy1 = setCourseRepoMock.findAllForTeacher(courses);
				const spy2 = setCourseRepoMock.findAllByUserId([]);

				const result = await service.getPermittedCourses(user, TaskParentPermission.write);

				expect(result).toEqual(courses);

				spy1.mockRestore();
				spy2.mockRestore();
			});

			it('should return no courses where the user is assigned as a student', async () => {
				const user = userFactory.build();
				const courses = courseFactory.buildList(3);

				const spy1 = setCourseRepoMock.findAllForTeacher([]);
				const spy2 = setCourseRepoMock.findAllByUserId(courses);

				const result = await service.getPermittedCourses(user, TaskParentPermission.write);

				expect(result).toEqual([]);

				spy1.mockRestore();
				spy2.mockRestore();
			});
		});
	});

	describe('getPermittedLessons', () => {
		describe('for courses where the user is assigned as a student', () => {
			it('should query the lesson repo for all visible lessons of these courses', async () => {
				const user = userFactory.build();
				const courses = [courseFactory.buildWithId({ students: [user] })];
				const courseIds = courses.map((c) => c.id);
				const spy = setLessonRepoMock.findAllByCourseIds([]);

				await service.getPermittedLessons(user, courses);

				expect(spy).toBeCalledWith(courseIds, { hidden: false });

				spy.mockRestore();
			});
		});
		describe('for courses where the user is assigned as a teacher', () => {
			it('should query the lesson repo for all lessons of these courses', async () => {
				const user = userFactory.build();
				const courses = [courseFactory.buildWithId({ teachers: [user] })];
				const courseIds = courses.map((c) => c.id);
				const spy = setLessonRepoMock.findAllByCourseIds([]);

				await service.getPermittedLessons(user, courses);

				expect(spy).toBeCalledWith(courseIds);

				spy.mockRestore();
			});
		});
		describe('for courses where the user is assigned as a substitution teacher', () => {
			it('should query the lesson repo for all lessons of these courses', async () => {
				const user = userFactory.build();
				const courses = [courseFactory.buildWithId({ substitutionTeachers: [user] })];
				const courseIds = courses.map((c) => c.id);
				const spy = setLessonRepoMock.findAllByCourseIds([]);

				await service.getPermittedLessons(user, courses);

				expect(spy).toBeCalledWith(courseIds);

				spy.mockRestore();
			});
		});
	});

	describe('hasTaskPermission', () => {
		describe('when testing read permission', () => {
			it('should return true if the user is the task creator', () => {
				const user = userFactory.build();
				const task = taskFactory.build({ creator: user });

				const result = service.hasTaskPermission(user, task, TaskParentPermission.read);

				expect(result).toBe(true);
			});

			it('should return true if the user is a student', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build({ students: [user] });
				const task = taskFactory.build({ course });

				const result = service.hasTaskPermission(user, task, TaskParentPermission.read);

				expect(result).toBe(true);
			});

			it('should return true if the user is a substitution teacher', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build({ substitutionTeachers: [user] });
				const task = taskFactory.build({ course });

				const result = service.hasTaskPermission(user, task, TaskParentPermission.read);

				expect(result).toBe(true);
			});

			it('should return true if the user is a teacher', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build({ teachers: [user] });
				const task = taskFactory.build({ course });

				const result = service.hasTaskPermission(user, task, TaskParentPermission.read);

				expect(result).toBe(true);
			});
		});

		describe('when testing write permission', () => {
			it('should return true if the user is the task creator', () => {
				const user = userFactory.build();
				const task = taskFactory.build({ creator: user });

				const result = service.hasTaskPermission(user, task, TaskParentPermission.write);

				expect(result).toBe(true);
			});

			it('should return false if the user is a student', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build({ students: [user] });
				const task = taskFactory.build({ course });

				const result = service.hasTaskPermission(user, task, TaskParentPermission.write);

				expect(result).toBe(false);
			});

			it('should return true if the user is a substitution teacher', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build({ substitutionTeachers: [user] });
				const task = taskFactory.build({ course });

				const result = service.hasTaskPermission(user, task, TaskParentPermission.write);

				expect(result).toBe(true);
			});

			it('should return true if the user is a teacher', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build({ teachers: [user] });
				const task = taskFactory.build({ course });

				const result = service.hasTaskPermission(user, task, TaskParentPermission.write);

				expect(result).toBe(true);
			});
		});

		describe('hasTaskDashboardPermission', () => {
			it('should call role repository with the user roles', () => {
				const roles = roleFactory.buildList(2);
				const user = userFactory.build({ roles });

				const spy = jest.spyOn(permissionService, 'resolveRolesAndPermissions').mockReturnValue([[], []]);

				service.hasOneOfTaskDashboardPermissions(user, TaskDashBoardPermission.studentDashboard);

				expect(spy).toBeCalledWith(user);

				spy.mockRestore();
			});

			describe('when checking for one permission', () => {
				it('should return true if it matches the permission', () => {
					const user = userFactory.build();

					const spy = jest
						.spyOn(permissionService, 'resolveRolesAndPermissions')
						.mockReturnValue([[], [TaskDashBoardPermission.studentDashboard]]);

					const result = service.hasOneOfTaskDashboardPermissions(user, TaskDashBoardPermission.studentDashboard);
					expect(result).toBe(true);

					spy.mockRestore();
				});

				it('should return false if it does not match the permission', () => {
					const user = userFactory.build();

					const spy = jest
						.spyOn(permissionService, 'resolveRolesAndPermissions')
						.mockReturnValue([[], [TaskDashBoardPermission.studentDashboard]]);

					const result = service.hasOneOfTaskDashboardPermissions(user, TaskDashBoardPermission.teacherDashboard);
					expect(result).toBe(false);

					spy.mockRestore();
				});
			});

			describe('when checking for more than one permission', () => {
				it('should return true if it matches the permissions', () => {
					const user = userFactory.build();

					const spy = jest
						.spyOn(permissionService, 'resolveRolesAndPermissions')
						.mockReturnValue([
							[],
							[TaskDashBoardPermission.studentDashboard, TaskDashBoardPermission.teacherDashboard],
						]);

					const result = service.hasOneOfTaskDashboardPermissions(user, [
						TaskDashBoardPermission.studentDashboard,
						TaskDashBoardPermission.teacherDashboard,
					]);

					expect(result).toBe(true);

					spy.mockRestore();
				});

				it('should return false if it does not match the permissions', () => {
					const user = userFactory.build();

					const spy = jest.spyOn(permissionService, 'resolveRolesAndPermissions').mockReturnValue([[], ['test']]);

					const result = service.hasOneOfTaskDashboardPermissions(user, [
						TaskDashBoardPermission.studentDashboard,
						TaskDashBoardPermission.teacherDashboard,
					]);

					expect(result).toBe(false);

					spy.mockRestore();
				});
			});
		});
	});
});
