import { Configuration } from '@hpi-schul-cloud/commons';

import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common';
import { Actions, Course, ITaskUpdate, Permission, Task, TaskWithStatusVo, User } from '@shared/domain';
import { CourseRepo, LessonRepo, TaskRepo, UserRepo } from '@shared/repo';
import {
	courseFactory,
	lessonFactory,
	setupEntities,
	submissionFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { AuthorizationService } from '@src/modules';
import { FileParamBuilder, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { SubmissionService } from './submission.service';
import { TaskService } from './task.service';

let userRepo: DeepMocked<UserRepo>;
let courseRepo: DeepMocked<CourseRepo>;
let lessonRepo: DeepMocked<LessonRepo>;
let authorizationService: DeepMocked<AuthorizationService>;

describe('TaskService', () => {
	let module: TestingModule;
	let taskRepo: DeepMocked<TaskRepo>;
	let taskService: TaskService;
	let submissionService: DeepMocked<SubmissionService>;
	let fileStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TaskService,
				{
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},
				{ provide: AuthorizationService, useValue: createMock<AuthorizationService>() },
				{ provide: CourseRepo, useValue: createMock<CourseRepo>() },
				{ provide: LessonRepo, useValue: createMock<LessonRepo>() },
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: SubmissionService,
					useValue: createMock<SubmissionService>(),
				},
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
			],
		}).compile();

		taskRepo = module.get(TaskRepo);
		taskService = module.get(TaskService);
		submissionService = module.get(SubmissionService);
		userRepo = module.get(UserRepo);
		courseRepo = module.get(CourseRepo);
		lessonRepo = module.get(LessonRepo);
		authorizationService = module.get(AuthorizationService);
		fileStorageClientAdapterService = module.get(FilesStorageClientAdapterService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('findBySingleParent', () => {
		const setup = () => {
			const courseId = 'courseId';
			const creatorId = 'user-id';
			const user = userFactory.buildWithId();

			return { courseId, creatorId, user };
		};

		it('should call findBySingleParent from task repo', async () => {
			const { creatorId, courseId } = setup();

			taskRepo.findBySingleParent.mockResolvedValueOnce([[], 0]);

			await expect(taskService.findBySingleParent(creatorId, courseId)).resolves.toEqual([[], 0]);
			expect(taskRepo.findBySingleParent).toBeCalledWith(creatorId, courseId, {}, undefined);
			taskRepo.findBySingleParent.mockRestore();
		});
		it('should check for teacher permission to view tasks', async () => {
			const { creatorId, courseId, user } = setup();
			await taskService.findBySingleParent(creatorId, courseId);
			expect(authorizationService.hasAllPermissions).toBeCalledWith(user, [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3]);
		});
		it('should call repo without filter for userId when user has TASK_DASHBOARD_TEACHER_VIEW_V3 permission', async () => {
			const { creatorId, courseId } = setup();
			authorizationService.hasAllPermissions.mockReturnValueOnce(true);
			await taskService.findBySingleParent(creatorId, courseId);
			expect(taskRepo.findBySingleParent).toBeCalledWith(creatorId, courseId, {}, undefined);
		});
		it('should call repo with filter for userId when user has no TASK_DASHBOARD_TEACHER_VIEW_V3 permission', async () => {
			const { courseId, user } = setup();
			authorizationService.hasAllPermissions.mockReturnValueOnce(false);
			taskRepo.findBySingleParent.mockResolvedValueOnce([[], 0]);
			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
			await taskService.findBySingleParent(user.id, courseId);

			expect(taskRepo.findBySingleParent).toBeCalledWith(user.id, courseId, { userId: user.id }, undefined);
		});
	});

	describe('findById', () => {
		it('should call findById from task repo', async () => {
			const task = taskFactory.buildWithId();
			taskRepo.findById.mockResolvedValueOnce(task);

			await expect(taskService.findById(task.id)).resolves.toEqual(task);
			expect(taskRepo.findById).toBeCalledWith(task.id);
		});
	});

	describe('delete', () => {
		const setup = () => {
			const task = taskFactory.buildWithId();
			const submissions = submissionFactory.buildList(3, { task });

			return { task, submissions };
		};

		it('should call fileStorageClientAdapterService.deleteFilesOfParent', async () => {
			const { task } = setup();

			await taskService.delete(task);

			const params = FileParamBuilder.build(task.school.id, task);
			expect(fileStorageClientAdapterService.deleteFilesOfParent).toBeCalledWith(params);
		});

		it('should call submissionService.delete() for all related submissions', async () => {
			const { task, submissions } = setup();

			await taskService.delete(task);

			expect(submissionService.delete).toBeCalledTimes(3);
			expect(submissionService.delete).toBeCalledWith(submissions[0]);
		});

		it('should call TaskRepo.delete() with Task', async () => {
			const { task } = setup();

			await taskService.delete(task);

			expect(taskRepo.delete).toBeCalledWith(task);
		});
	});

	describe('Single task', () => {
		beforeEach(() => {
			jest.spyOn(Configuration, 'get').mockImplementation((config: string) => {
				if (config === 'FEATURE_TASK_CARD_ENABLED') {
					return true;
				}
				return null;
			});
		});

		describe('create task', () => {
			let course: Course;
			let user: User;
			beforeEach(() => {
				user = userFactory.buildWithId();
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				course = courseFactory.buildWithId({ teachers: [user] });
				courseRepo.findById.mockResolvedValue(course);
				taskRepo.save.mockResolvedValue();
				authorizationService.hasAllPermissions.mockReturnValue(true);
			});
			afterEach(() => {
				courseRepo.findById.mockRestore();
				taskRepo.save.mockRestore();
				authorizationService.hasOneOfPermissions.mockRestore();
				authorizationService.getUserWithPermissions.mockRestore();
			});

			it('should throw if availableDate is not before dueDate', async () => {
				const availableDate = new Date('2023-01-12T00:00:00');
				const dueDate = new Date('2023-01-11T00:00:00');
				const params = { name: 'test', availableDate, dueDate };
				await expect(async () => {
					await taskService.create(user.id, params);
				}).rejects.toThrow(ValidationError);
			});
			it('should check for permission to create the task', async () => {
				await taskService.create(user.id, { name: 'test' });
				expect(authorizationService.hasAllPermissions).toBeCalledWith(user, [Permission.HOMEWORK_CREATE]);
			});
			it('should throw if the user has no permission', async () => {
				authorizationService.hasAllPermissions.mockReturnValue(false);
				await expect(async () => {
					await taskService.create(user.id, { name: 'test' });
				}).rejects.toThrow(UnauthorizedException);
				authorizationService.hasAllPermissions.mockRestore();
			});
			it('should check for course permission to create the task in a course', async () => {
				await taskService.create(user.id, { name: 'test', courseId: course.id });
				expect(authorizationService.checkPermission).toBeCalledWith(user, course, {
					action: Actions.write,
					requiredPermissions: [],
				});
			});
			it('should check for lesson permission to create the task in a lesson', async () => {
				const lesson = lessonFactory.buildWithId({ course });
				lessonRepo.findById.mockResolvedValue(lesson);
				await taskService.create(user.id, { name: 'test', courseId: course.id, lessonId: lesson.id });
				expect(authorizationService.checkPermission).toBeCalledWith(user, lesson, {
					action: Actions.write,
					requiredPermissions: [],
				});
			});
			it('should throw if lesson does not belong to course', async () => {
				const lesson = lessonFactory.buildWithId();
				lessonRepo.findById.mockResolvedValue(lesson);
				await expect(async () => {
					await taskService.create(user.id, { name: 'test', courseId: course.id, lessonId: lesson.id });
				}).rejects.toThrow(ForbiddenException);

				lessonRepo.findById.mockRestore();
			});
			it('should throw if not all users do not belong to course', async () => {
				course = courseFactory.studentsWithId(2).buildWithId();
				const someUser = userFactory.buildWithId();

				await expect(async () => {
					await taskService.create(user.id, { name: 'test', courseId: course.id, usersIds: [someUser.id] });
				}).rejects.toThrow(ForbiddenException);
			});
			it('should save the task', async () => {
				const taskMock = {
					name: 'test',
					creator: user,
				};
				await taskService.create(user.id, { name: 'test' });
				expect(taskRepo.save).toHaveBeenCalledWith(expect.objectContaining({ ...taskMock }));
			});
			it('should save the task with course', async () => {
				const taskMock = {
					name: 'test',
					course,
				};
				await taskService.create(user.id, { name: 'test', courseId: course.id });
				expect(taskRepo.save).toHaveBeenCalledWith(expect.objectContaining({ ...taskMock }));
			});
			it('should save the task with course and lesson', async () => {
				const lesson = lessonFactory.buildWithId({ course });
				lessonRepo.findById.mockResolvedValue(lesson);
				const taskMock = {
					name: 'test',
					course,
					lesson,
				};
				await taskService.create(user.id, { name: 'test', courseId: course.id, lessonId: lesson.id });
				expect(taskRepo.save).toHaveBeenCalledWith(expect.objectContaining({ ...taskMock }));

				lessonRepo.findById.mockRestore();
			});
			it('should save the task with course and assigned users', async () => {
				const student1 = userFactory.buildWithId();
				const student2 = userFactory.buildWithId();
				const course2 = courseFactory.buildWithId({ teachers: [user], students: [student1, student2] });
				courseRepo.findById.mockResolvedValue(course2);
				userRepo.findById.mockImplementation((id) => {
					if (id === student1.id) {
						return Promise.resolve(student1);
					}
					if (id === student2.id) {
						return Promise.resolve(student2);
					}
					return Promise.resolve(user);
				});
				const taskWithStatusVo: TaskWithStatusVo = await taskService.create(user.id, {
					name: 'test',
					courseId: course2.id,
					usersIds: [student1.id],
				});
				expect(taskRepo.save).toBeCalled();
				expect(taskWithStatusVo.task.users.getItems()).toEqual([student1]);
			});
			it('should return the task and its status', async () => {
				const taskMock = {
					name: 'test',
					creator: user,
					course,
				};
				authorizationService.hasPermission.mockReturnValue(true);
				const result = await taskService.create(user.id, { name: 'test', courseId: course.id });
				expect(result.task).toEqual(expect.objectContaining(taskMock));
				expect(result.status.isDraft).toEqual(true);
			});
		});
		describe('update task', () => {
			let course: Course;
			let task: Task;
			let user: User;
			beforeEach(() => {
				user = userFactory.buildWithId();
				course = courseFactory.buildWithId({ teachers: [user] });

				task = taskFactory.build({ course });
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				courseRepo.findById.mockResolvedValue(course);

				taskRepo.findById.mockResolvedValue(task);
				taskRepo.save.mockResolvedValue();
			});

			afterEach(() => {
				courseRepo.findById.mockRestore();
				taskRepo.save.mockRestore();
				taskRepo.findById.mockRestore();
				authorizationService.getUserWithPermissions.mockRestore();
			});
			it('should throw if availableDate is not before dueDate', async () => {
				const availableDate = new Date('2023-01-12T00:00:00');
				const dueDate = new Date('2023-01-11T00:00:00');
				const params = { name: 'test', availableDate, dueDate };
				await expect(async () => {
					await taskService.update(user.id, task.id, params);
				}).rejects.toThrow(ValidationError);
			});
			it('should check for permission to update the task', async () => {
				const params = {
					name: 'test',
				};
				await taskService.update(user.id, task.id, params);
				expect(authorizationService.checkPermission).toBeCalledWith(user, task, {
					action: Actions.write,
					requiredPermissions: [Permission.HOMEWORK_EDIT],
				});
			});
			it('should check authorization for course', async () => {
				const params = {
					name: 'test',
					courseId: course.id,
				};
				await taskService.update(user.id, task.id, params);
				expect(authorizationService.checkPermission).toBeCalledWith(user, course, {
					action: Actions.write,
					requiredPermissions: [],
				});
			});
			it('should save the task with course', async () => {
				const params = {
					name: 'test',
					courseId: course.id,
				};
				await taskService.update(user.id, task.id, params);
				expect(taskRepo.save).toHaveBeenCalledWith({ ...task, name: params.name });
			});
			it('should save the task with course and lesson', async () => {
				const lesson = lessonFactory.buildWithId({ course });
				lessonRepo.findById.mockResolvedValue(lesson);
				const params = {
					name: 'test',
					courseId: course.id,
					lessonId: lesson.id,
				};
				await taskService.update(user.id, task.id, params);
				expect(taskRepo.save).toHaveBeenCalledWith({ ...task, name: params.name, lessonId: lesson.id });

				lessonRepo.findById.mockRestore();
			});
			describe('when remove is true', () => {
				it('should save the task and remove course', async () => {
					const params = {
						name: 'test',
					};
					const taskWithStatusVo: TaskWithStatusVo = await taskService.update(user.id, task.id, params, true);
					expect(taskRepo.save).toHaveBeenCalledWith({ ...task, name: params.name });
					expect(taskWithStatusVo.task.course).toBe(undefined);
				});
				it('should save the task with course and remove lesson', async () => {
					const lesson = lessonFactory.buildWithId({ course });
					lessonRepo.findById.mockResolvedValue(lesson);
					task = taskFactory.build({ course, lesson });
					taskRepo.findById.mockResolvedValue(task);

					const params = {
						name: 'test',
						courseId: course.id,
					};
					const taskWithStatusVo: TaskWithStatusVo = await taskService.update(user.id, task.id, params, true);
					expect(taskRepo.save).toHaveBeenCalledWith({ ...task, name: params.name });
					expect(taskWithStatusVo.task.lesson).toBe(undefined);

					lessonRepo.findById.mockRestore();
				});
				it('should save the task with course and remove users', async () => {
					const student1 = userFactory.buildWithId();
					const student2 = userFactory.buildWithId();

					const courseWithStudents = courseFactory.buildWithId({ teachers: [user], students: [student1, student2] });
					courseRepo.findById.mockResolvedValue(courseWithStudents);

					userRepo.findById.mockImplementation((id) => {
						if (id === student1.id) {
							return Promise.resolve(student1);
						}
						if (id === student2.id) {
							return Promise.resolve(student2);
						}
						return Promise.resolve(user);
					});

					const task2 = taskFactory.build({ course, users: [student1, student2] });
					taskRepo.findById.mockResolvedValue(task2);

					const params = {
						name: 'test',
						courseId: course.id,
					};

					const taskWithStatusVo: TaskWithStatusVo = await taskService.update(user.id, task2.id, params, true);

					expect(taskRepo.save).toHaveBeenCalled();
					expect(taskWithStatusVo.task.users.getItems()).toStrictEqual([]);
				});
			});
			it('should throw if not all users do not belong to course', async () => {
				const someUser = userFactory.buildWithId();
				const params = {
					name: 'test',
					courseId: course.id,
					usersIds: [someUser.id],
				};

				await expect(async () => {
					await taskService.update(user.id, task.id, params);
				}).rejects.toThrow(ForbiddenException);
			});
			it('should throw if lesson does not belong to course', async () => {
				const lesson = lessonFactory.buildWithId();
				lessonRepo.findById.mockResolvedValue(lesson);
				const params = {
					name: 'test',
					courseId: course.id,
					lessonId: lesson.id,
				};
				await expect(async () => {
					await taskService.update(user.id, task.id, params);
				}).rejects.toThrow(ForbiddenException);

				lessonRepo.findById.mockRestore();
			});
			it('should return the updated task', async () => {
				const params = {
					name: 'test',
					courseId: course.id,
				};
				const result = await taskService.update(user.id, task.id, params);
				expect(result.task).toEqual({ ...task, name: params.name });
				expect(result.status).toBeDefined();
			});
			it('should return the task with course and assigned users', async () => {
				const student1 = userFactory.buildWithId();
				const student2 = userFactory.buildWithId();
				const courseWithStudents = courseFactory.buildWithId({ teachers: [user], students: [student1, student2] });
				courseRepo.findById.mockResolvedValue(courseWithStudents);
				userRepo.findById.mockImplementation((id) => {
					if (id === student1.id) {
						return Promise.resolve(student1);
					}
					if (id === student2.id) {
						return Promise.resolve(student2);
					}
					return Promise.resolve(user);
				});

				task = taskFactory.build({ course: courseWithStudents, users: [student1] });

				const taskParams: ITaskUpdate = {
					name: 'test',
					courseId: courseWithStudents.id,
					usersIds: [student2.id],
				};
				const taskWithStatusVo: TaskWithStatusVo = await taskService.update(user.id, task.id, taskParams);
				expect(taskRepo.save).toBeCalled();
				expect(taskWithStatusVo.task.users.getItems()).toEqual([student2]);
			});
		});
		describe('find task', () => {
			let task: Task;
			let user: User;
			beforeEach(() => {
				user = userFactory.buildWithId();
				task = taskFactory.build();
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				taskRepo.findById.mockResolvedValue(task);
			});
			afterEach(() => {
				authorizationService.getUserWithPermissions.mockRestore();
				taskRepo.findById.mockRestore();
			});
			it('should check for permission to view the task', async () => {
				await taskService.find(user.id, task.id);
				expect(authorizationService.checkPermission).toBeCalledWith(user, task, {
					action: Actions.read,
					requiredPermissions: [Permission.HOMEWORK_VIEW],
				});
			});
			it('should check also user permission to edit task', async () => {
				await taskService.find(user.id, task.id);
				expect(authorizationService.hasOneOfPermissions).toBeCalledWith(user, [Permission.HOMEWORK_EDIT]);
			});
			it('should return the task with its status for student if user has only view permission', async () => {
				authorizationService.hasOneOfPermissions.mockReturnValue(false);

				const result = await taskService.find(user.id, task.id);
				expect(result.task).toEqual(task);
				expect(result.status).toBeDefined();
			});
			it('should return the task with its status for student if user has only edit permission', async () => {
				authorizationService.hasOneOfPermissions.mockReturnValue(true);

				const result = await taskService.find(user.id, task.id);
				expect(result.task).toEqual(task);
				expect(result.status).toBeDefined();
			});
		});
	});
});
