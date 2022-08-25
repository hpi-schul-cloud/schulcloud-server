import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { MikroORM } from '@mikro-orm/core';
import { ForbiddenException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Actions, CopyHelperService, PermissionTypes, TaskCopyService, User } from '@shared/domain';
import { FileCopyAppendService } from '@shared/domain/service/file-copy-append.service';
import { CopyElementType, CopyStatusEnum } from '@shared/domain/types';
import { CourseRepo, LessonRepo, TaskRepo, UserRepo } from '@shared/repo';
import { courseFactory, lessonFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { TaskCopyUC } from './task-copy.uc';

describe('task copy uc', () => {
	let orm: MikroORM;
	let uc: TaskCopyUC;
	let userRepo: DeepMocked<UserRepo>;
	let taskRepo: DeepMocked<TaskRepo>;
	let courseRepo: DeepMocked<CourseRepo>;
	let lessonRepo: DeepMocked<LessonRepo>;
	let authorisation: DeepMocked<AuthorizationService>;
	let taskCopyService: DeepMocked<TaskCopyService>;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let fileCopyAppendService: DeepMocked<FileCopyAppendService>;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				TaskCopyUC,
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: LessonRepo,
					useValue: createMock<LessonRepo>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: TaskCopyService,
					useValue: createMock<TaskCopyService>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
				{
					provide: FileCopyAppendService,
					useValue: createMock<FileCopyAppendService>(),
				},
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
			],
		}).compile();

		uc = module.get(TaskCopyUC);
		userRepo = module.get(UserRepo);
		taskRepo = module.get(TaskRepo);
		authorisation = module.get(AuthorizationService);
		courseRepo = module.get(CourseRepo);
		lessonRepo = module.get(LessonRepo);
		taskCopyService = module.get(TaskCopyService);
		fileCopyAppendService = module.get(FileCopyAppendService);
		copyHelperService = module.get(CopyHelperService);
		Configuration.set('FEATURE_COPY_SERVICE_ENABLED', true);
	});

	describe('copy task', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId({ teachers: [user] });
			const lesson = lessonFactory.buildWithId({ course });
			const allTasks = taskFactory.buildList(3, { course });
			const task = allTasks[0];
			authorisation.getUserWithPermissions.mockResolvedValue(user);
			taskRepo.findById.mockResolvedValue(task);
			taskRepo.findBySingleParent.mockResolvedValue([allTasks, allTasks.length]);
			courseRepo.findById.mockResolvedValue(course);
			authorisation.hasPermission.mockReturnValue(true);
			const copyName = 'name of the copy';
			copyHelperService.deriveCopyName.mockReturnValue(copyName);
			const copy = taskFactory.buildWithId({ creator: user, course });
			const status = {
				title: 'taskCopy',
				type: CopyElementType.TASK,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: copy,
			};
			taskCopyService.copyTaskMetadata.mockReturnValue(status);
			taskRepo.save.mockResolvedValue(undefined);
			fileCopyAppendService.appendFiles.mockResolvedValue(status);
			const jwt = 'some-jwt-string';
			return {
				user,
				course,
				lesson,
				task,
				copyName,
				copy,
				allTasks,
				status,
				jwt,
			};
		};

		it('should throw if copy feature is deactivated', async () => {
			Configuration.set('FEATURE_COPY_SERVICE_ENABLED', false);
			const { course, user, task } = setup();
			await expect(uc.copyTask(user.id, task.id, { courseId: course.id, jwt: 'some-jwt-string' })).rejects.toThrowError(
				InternalServerErrorException
			);
		});

		describe('status', () => {
			it('should return status', async () => {
				const { course, lesson, user, task, status } = setup();
				const result = await uc.copyTask(user.id, task.id, {
					courseId: course.id,
					lessonId: lesson.id,
					jwt: 'some-jwt-string',
				});
				expect(result).toEqual(status);
			});
		});

		describe('repos', () => {
			it('should fetch correct user', async () => {
				const { course, user, task } = setup();
				await uc.copyTask(user.id, task.id, { courseId: course.id, jwt: 'some-jwt-string' });
				expect(authorisation.getUserWithPermissions).toBeCalledWith(user.id);
			});

			it('should fetch correct task', async () => {
				const { course, user, task } = setup();
				await uc.copyTask(user.id, task.id, { courseId: course.id, jwt: 'some-jwt-string' });
				expect(taskRepo.findById).toBeCalledWith(task.id);
			});

			it('should fetch destination course', async () => {
				const { course, user, task } = setup();
				await uc.copyTask(user.id, task.id, { courseId: course.id, jwt: 'some-jwt-string' });
				expect(courseRepo.findById).toBeCalledWith(course.id);
			});

			it('should pass without destination course', async () => {
				const { user, task } = setup();
				await uc.copyTask(user.id, task.id, { jwt: 'some-jwt-string' });
				expect(courseRepo.findById).not.toHaveBeenCalled();
			});

			it('should fetch destination lesson', async () => {
				const { lesson, user, task } = setup();
				await uc.copyTask(user.id, task.id, { lessonId: lesson.id, jwt: 'some-jwt-string' });
				expect(lessonRepo.findById).toBeCalledWith(lesson.id);
			});

			it('should pass without destination lesson', async () => {
				const { user, task } = setup();
				await uc.copyTask(user.id, task.id, { jwt: 'some-jwt-string' });
				expect(lessonRepo.findById).not.toHaveBeenCalled();
			});

			it('should persist copy', async () => {
				const { course, lesson, user, task, copy } = setup();
				await uc.copyTask(user.id, task.id, { courseId: course.id, lessonId: lesson.id, jwt: 'some-jwt-string' });
				expect(taskRepo.save).toBeCalledWith(copy);
			});

			it('should try to append file copies from original task to task copy', async () => {
				const { course, lesson, user, task, jwt } = setup();
				const copyStatus = await uc.copyTask(user.id, task.id, { courseId: course.id, lessonId: lesson.id, jwt });
				expect(fileCopyAppendService.appendFiles).toBeCalledWith(copyStatus, jwt);
			});
		});

		describe('permissions', () => {
			it('should check authorisation for task', async () => {
				const { course, lesson, user, task } = setup();
				await uc.copyTask(user.id, task.id, { courseId: course.id, lessonId: lesson.id, jwt: 'some-jwt-string' });
				expect(authorisation.hasPermission).toBeCalledWith(user, task, {
					action: Actions.read,
					requiredPermissions: [],
				});
			});

			it('should check authorisation for destination course', async () => {
				const { course, user, task } = setup();
				await uc.copyTask(user.id, task.id, { courseId: course.id, jwt: 'some-jwt-string' });
				expect(authorisation.hasPermission).toBeCalledWith(user, course, {
					action: Actions.write,
					requiredPermissions: [],
				});
			});

			it('should pass authorisation check without destination course', async () => {
				const { course, user, task } = setup();
				await uc.copyTask(user.id, task.id, { jwt: 'some-jwt-string' });
				expect(authorisation.hasPermission).not.toBeCalledWith(user, course, {
					action: Actions.write,
					requiredPermissions: [],
				});
			});

			it('should check authorisation for destination lesson', async () => {
				const { lesson, user, task } = setup();
				await uc.copyTask(user.id, task.id, { lessonId: lesson.id, jwt: 'some-jwt-string' });
				expect(authorisation.hasPermission).toBeCalledWith(user, lesson, {
					action: Actions.write,
					requiredPermissions: [],
				});
			});

			it('should pass authorisation check without destination lesson', async () => {
				const { lesson, user, task } = setup();
				await uc.copyTask(user.id, task.id, { jwt: 'some-jwt-string' });
				expect(authorisation.hasPermission).not.toBeCalledWith(user, lesson, {
					action: Actions.write,
					requiredPermissions: [],
				});
			});

			describe('when access to task is forbidden', () => {
				const setupWithTaskForbidden = () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId();
					const lesson = lessonFactory.buildWithId({ course });
					const task = taskFactory.buildWithId();
					userRepo.findById.mockResolvedValue(user);
					taskRepo.findById.mockResolvedValue(task);
					authorisation.hasPermission.mockImplementation((u: User, e: PermissionTypes) => e !== task);
					return { user, course, lesson, task };
				};

				it('should throw NotFoundException', async () => {
					const { course, lesson, user, task } = setupWithTaskForbidden();

					try {
						await uc.copyTask(user.id, task.id, { courseId: course.id, lessonId: lesson.id, jwt: 'some-jwt-string' });
						throw new Error('should have failed');
					} catch (err) {
						expect(err).toBeInstanceOf(NotFoundException);
					}
				});
			});

			describe('when access to course is forbidden', () => {
				const setupWithCourseForbidden = () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId();
					const task = taskFactory.buildWithId();
					userRepo.findById.mockResolvedValue(user);
					taskRepo.findById.mockResolvedValue(task);
					courseRepo.findById.mockResolvedValue(course);
					authorisation.hasPermission.mockImplementation((u: User, e: PermissionTypes) => e !== course);
					return { user, course, task };
				};

				it('should throw Forbidden Exception', async () => {
					const { course, user, task } = setupWithCourseForbidden();

					try {
						await uc.copyTask(user.id, task.id, { courseId: course.id, jwt: 'some-jwt-string' });
						throw new Error('should have failed');
					} catch (err) {
						expect(err).toBeInstanceOf(ForbiddenException);
					}
				});
			});
		});

		describe('derive copy name', () => {
			it('should derive name for copy', async () => {
				const { course, user, task, allTasks } = setup();
				await uc.copyTask(user.id, task.id, { courseId: course.id, jwt: 'some-jwt-string' });
				const existingNames = allTasks.map((t) => t.name);
				expect(existingNames.length).toEqual(3);
				expect(copyHelperService.deriveCopyName).toBeCalledWith(task.name, existingNames);
			});

			it('should use findAllByParentIds to determine existing task names', async () => {
				const { course, user, task } = setup();
				await uc.copyTask(user.id, task.id, { courseId: course.id, jwt: 'some-jwt-string' });
				expect(taskRepo.findBySingleParent).toHaveBeenCalledWith('', course.id);
			});

			it('should call copy service', async () => {
				const { course, lesson, user, task, copyName } = setup();
				await uc.copyTask(user.id, task.id, { courseId: course.id, lessonId: lesson.id, jwt: 'some-jwt-string' });
				expect(taskCopyService.copyTaskMetadata).toBeCalledWith({
					originalTask: task,
					destinationCourse: course,
					destinationLesson: lesson,
					user,
					copyName,
				});
			});
		});

		describe('when access to lesson is forbidden', () => {
			const setupWithLessonForbidden = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const lesson = lessonFactory.buildWithId({ course });
				const task = taskFactory.buildWithId();
				jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));
				jest.spyOn(taskRepo, 'findById').mockImplementation(() => Promise.resolve(task));
				jest.spyOn(courseRepo, 'findById').mockImplementation(() => Promise.resolve(course));
				jest.spyOn(lessonRepo, 'findById').mockImplementation(() => Promise.resolve(lesson));
				jest.spyOn(authorisation, 'hasPermission').mockImplementation((u: User, e: PermissionTypes) => {
					if (e === lesson) return false;
					return true;
				});
				return { user, lesson, task };
			};

			it('should throw Forbidden Exception', async () => {
				const { lesson, user, task } = setupWithLessonForbidden();

				try {
					await uc.copyTask(user.id, task.id, { lessonId: lesson.id, jwt: 'some-jwt-string' });
					throw new Error('should have failed');
				} catch (err) {
					expect(err).toBeInstanceOf(ForbiddenException);
				}
			});
		});
	});
});
