import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { ObjectId } from '@mikro-orm/mongodb';
import { ForbiddenException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseDO, User } from '@shared/domain';
import { CourseRepo, LessonRepo, TaskRepo, UserRepo } from '@shared/repo';
import { courseFactory, lessonFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { Action, AuthorizableReferenceType, AuthorizationService } from '@src/modules/authorization';
import { CopyElementType, CopyHelperService, CopyStatusEnum } from '@src/modules/copy-helper';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { TaskCopyService } from '../service';
import { TaskCopyUC } from './task-copy.uc';

describe('task copy uc', () => {
	let uc: TaskCopyUC;
	let userRepo: DeepMocked<UserRepo>;
	let taskRepo: DeepMocked<TaskRepo>;
	let courseRepo: DeepMocked<CourseRepo>;
	let lessonRepo: DeepMocked<LessonRepo>;
	let authorisation: DeepMocked<AuthorizationService>;
	let taskCopyService: DeepMocked<TaskCopyService>;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let module: TestingModule;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
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
		copyHelperService = module.get(CopyHelperService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('copy task', () => {
		const setup = () => {
			Configuration.set('FEATURE_COPY_SERVICE_ENABLED', true);

			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId({ teachers: [user] });
			const lesson = lessonFactory.buildWithId({ course });
			const allTasks = taskFactory.buildList(3, { course });
			const task = allTasks[0];
			authorisation.getUserWithPermissions.mockResolvedValue(user);
			taskRepo.findById.mockResolvedValue(task);
			lessonRepo.findById.mockResolvedValue(lesson);
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
				originalEntity: task,
			};
			taskCopyService.copyTask.mockResolvedValue(status);
			taskRepo.save.mockResolvedValue(undefined);
			const userId = user.id;

			return {
				user,
				course,
				lesson,
				task,
				copyName,
				copy,
				allTasks,
				status,
				userId,
			};
		};

		describe('feature is deactivated', () => {
			it('should throw InternalServerErrorException', async () => {
				Configuration.set('FEATURE_COPY_SERVICE_ENABLED', false);

				await expect(uc.copyTask('user.id', 'task.id', { courseId: 'course.id', userId: 'test' })).rejects.toThrowError(
					InternalServerErrorException
				);
			});
		});

		describe('status', () => {
			it('should return status', async () => {
				const { course, lesson, user, task, status, userId } = setup();

				const result = await uc.copyTask(user.id, task.id, {
					courseId: course.id,
					lessonId: lesson.id,
					userId,
				});

				expect(result).toEqual(status);
			});
		});

		describe('repos', () => {
			it('should fetch correct user', async () => {
				const { course, user, task, userId } = setup();

				await uc.copyTask(user.id, task.id, { courseId: course.id, userId });

				expect(authorisation.getUserWithPermissions).toBeCalledWith(user.id);
			});

			it('should fetch correct task', async () => {
				const { course, user, task, userId } = setup();

				await uc.copyTask(user.id, task.id, { courseId: course.id, userId });

				expect(taskRepo.findById).toBeCalledWith(task.id);
			});

			it('should fetch destination course', async () => {
				const { course, user, task, userId } = setup();

				await uc.copyTask(user.id, task.id, { courseId: course.id, userId });

				expect(courseRepo.findById).toBeCalledWith(course.id);
			});

			it('should pass without destination course', async () => {
				const { user, task, userId } = setup();

				await uc.copyTask(user.id, task.id, { userId });
				expect(taskCopyService.copyTask).toHaveBeenCalled();
			});

			it('should fetch destination lesson', async () => {
				const { lesson, user, task, userId } = setup();

				await uc.copyTask(user.id, task.id, { lessonId: lesson.id, userId });

				expect(lessonRepo.findById).toBeCalledWith(lesson.id);
			});

			it('should pass without destination lesson', async () => {
				const { user, task, userId } = setup();

				await uc.copyTask(user.id, task.id, { userId });

				expect(lessonRepo.findById).not.toHaveBeenCalled();
			});
		});

		describe('permissions', () => {
			it('should check authorisation for task', async () => {
				const { course, lesson, user, task, userId } = setup();

				await uc.copyTask(user.id, task.id, { courseId: course.id, lessonId: lesson.id, userId });

				expect(authorisation.hasPermission).toBeCalledWith(user, task, {
					action: Action.read,
					requiredPermissions: [],
				});
			});

			it('should check authorisation for destination course', async () => {
				const { course, user, task, userId } = setup();

				await uc.copyTask(user.id, task.id, { courseId: course.id, userId });
				expect(authorisation.checkPermissionByReferences).toBeCalledWith(
					user.id,
					AuthorizableReferenceType.Course,
					course.id,
					{
						action: Action.write,
						requiredPermissions: [],
					}
				);
			});

			it('should pass authorisation check without destination course', async () => {
				const { course, user, task, userId } = setup();

				await uc.copyTask(user.id, task.id, { userId });

				expect(authorisation.hasPermission).not.toBeCalledWith(user, course, {
					action: Action.write,
					requiredPermissions: [],
				});
			});

			it('should check authorisation for destination lesson', async () => {
				const { lesson, user, task, userId } = setup();

				await uc.copyTask(user.id, task.id, { lessonId: lesson.id, userId });

				expect(authorisation.hasPermission).toBeCalledWith(user, lesson, {
					action: Action.write,
					requiredPermissions: [],
				});
			});

			it('should pass authorisation check without destination lesson', async () => {
				const { lesson, user, task, userId } = setup();

				await uc.copyTask(user.id, task.id, { userId });

				expect(authorisation.hasPermission).not.toBeCalledWith(user, lesson, {
					action: Action.write,
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
					// authorisation should not be mocked
					authorisation.hasPermission.mockImplementation((u: User, e: AuthorizableObject | BaseDO) => e !== task);
					return { user, course, lesson, task };
				};

				it('should throw NotFoundException', async () => {
					const { course, lesson, user, task } = setupWithTaskForbidden();

					try {
						await uc.copyTask(user.id, task.id, {
							courseId: course.id,
							lessonId: lesson.id,
							userId: new ObjectId().toHexString(),
						});
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
					// authorisation should not be mocked
					authorisation.hasPermission.mockImplementation((u: User, e: AuthorizableObject | BaseDO) => e !== course);
					authorisation.checkPermissionByReferences.mockImplementation(() => {
						throw new ForbiddenException();
					});
					return { user, course, task };
				};

				it('should throw Forbidden Exception', async () => {
					const { course, user, task } = setupWithCourseForbidden();

					try {
						await uc.copyTask(user.id, task.id, { courseId: course.id, userId: new ObjectId().toHexString() });
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

				await uc.copyTask(user.id, task.id, { courseId: course.id, userId: new ObjectId().toHexString() });

				const existingNames = allTasks.map((t) => t.name);
				expect(existingNames.length).toEqual(3);
				expect(copyHelperService.deriveCopyName).toBeCalledWith(task.name, existingNames);
			});

			it('should use findAllByParentIds to determine existing task names', async () => {
				const { course, user, task, userId } = setup();

				await uc.copyTask(user.id, task.id, { courseId: course.id, userId });

				expect(taskRepo.findBySingleParent).toHaveBeenCalledWith('', course.id);
			});

			it('should call copy service', async () => {
				const { course, lesson, user, task, copyName } = setup();

				await uc.copyTask(user.id, task.id, {
					courseId: course.id,
					lessonId: lesson.id,
					userId: new ObjectId().toHexString(),
				});

				expect(taskCopyService.copyTask).toBeCalledWith({
					originalTaskId: task.id,
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
				userRepo.findById.mockResolvedValue(user);
				taskRepo.findById.mockResolvedValue(task);
				courseRepo.findById.mockResolvedValue(course);
				lessonRepo.findById.mockResolvedValue(lesson);
				// Authorisation should not be mocked
				authorisation.hasPermission.mockImplementation((u: User, e: AuthorizableObject | BaseDO) => {
					if (e === lesson) return false;
					return true;
				});

				return { user, lesson, task };
			};

			it('should throw Forbidden Exception', async () => {
				const { lesson, user, task } = setupWithLessonForbidden();

				try {
					await uc.copyTask(user.id, task.id, { lessonId: lesson.id, userId: new ObjectId().toHexString() });
					throw new Error('should have failed');
				} catch (err) {
					expect(err).toBeInstanceOf(ForbiddenException);
				}
			});
		});
	});
});
