import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Action, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { CopyElementType, CopyHelperService, CopyStatusEnum } from '@modules/copy-helper';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { LessonService } from '@modules/lesson';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { ForbiddenException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { TaskCopyService } from '../domain';
import { Submission, Task, TaskRepo } from '../repo';
import { TASK_PUBLIC_API_CONFIG_TOKEN, TaskPublicApiConfig } from '../task.config';
import { taskFactory } from '../testing';
import { TaskCopyParentParams } from './dto';
import { TaskCopyUC } from './task-copy.uc';

describe('task copy uc', () => {
	let uc: TaskCopyUC;
	let taskRepo: DeepMocked<TaskRepo>;
	let courseService: DeepMocked<CourseService>;
	let lessonService: DeepMocked<LessonService>;
	let authorisation: DeepMocked<AuthorizationService>;
	let taskCopyService: DeepMocked<TaskCopyService>;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let module: TestingModule;
	let config: TaskPublicApiConfig;

	beforeAll(async () => {
		await setupEntities([User, Task, Submission, CourseEntity, CourseGroupEntity, LessonEntity, Material]);

		module = await Test.createTestingModule({
			providers: [
				TaskCopyUC,
				{
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: LessonService,
					useValue: createMock<LessonService>(),
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
				{
					provide: TASK_PUBLIC_API_CONFIG_TOKEN,
					useValue: {
						featureCopyServiceEnabled: true,
					},
				},
			],
		}).compile();

		uc = module.get(TaskCopyUC);
		taskRepo = module.get(TaskRepo);
		authorisation = module.get(AuthorizationService);
		courseService = module.get(CourseService);
		lessonService = module.get(LessonService);
		taskCopyService = module.get(TaskCopyService);
		copyHelperService = module.get(CopyHelperService);
		config = module.get<TaskPublicApiConfig>(TASK_PUBLIC_API_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('copy task', () => {
		const setup = () => {
			config.featureCopyServiceEnabled = true;

			const user = userFactory.buildWithId();
			const course = courseEntityFactory.buildWithId({ teachers: [user] });
			const lesson = lessonFactory.buildWithId({ course });
			const allTasks = taskFactory.buildList(3, { course });
			const task = allTasks[0];
			const copyName = 'name of the copy';

			const copy = taskFactory.buildWithId({ creator: user, course });
			const status = {
				title: 'taskCopy',
				type: CopyElementType.TASK,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: copy,
				originalEntity: task,
			};

			authorisation.getUserWithPermissions.mockResolvedValueOnce(user);
			taskRepo.findById.mockResolvedValueOnce(task);
			lessonService.findById.mockResolvedValueOnce(lesson);
			taskRepo.findBySingleParent.mockResolvedValueOnce([allTasks, allTasks.length]);
			courseService.findById.mockResolvedValueOnce(course);
			authorisation.hasPermission.mockReturnValueOnce(true).mockReturnValueOnce(true);
			copyHelperService.deriveCopyName.mockReturnValueOnce(copyName);
			taskCopyService.copyTask.mockResolvedValueOnce(status);
			taskRepo.save.mockResolvedValueOnce();

			return {
				user,
				course,
				lesson,
				task,
				copyName,
				copy,
				allTasks,
				status,
				userId: user.id,
			};
		};

		describe('feature is deactivated', () => {
			it('should throw InternalServerErrorException', async () => {
				const { course, user, task, userId } = setup();
				config.featureCopyServiceEnabled = false;

				await expect(uc.copyTask(user.id, task.id, { courseId: course.id, userId })).rejects.toThrowError(
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

				expect(courseService.findById).toBeCalledWith(course.id);
			});

			it('should pass without destination course', async () => {
				const { user, task, userId } = setup();

				await uc.copyTask(user.id, task.id, { userId });
				expect(taskCopyService.copyTask).toHaveBeenCalled();
			});

			it('should fetch destination lesson', async () => {
				const { lesson, user, task, userId } = setup();

				await uc.copyTask(user.id, task.id, { lessonId: lesson.id, userId });

				expect(lessonService.findById).toBeCalledWith(lesson.id);
			});

			it('should pass without destination lesson', async () => {
				const { user, task, userId } = setup();

				await uc.copyTask(user.id, task.id, { userId });

				expect(lessonService.findById).not.toHaveBeenCalled();
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

				const context = AuthorizationContextBuilder.write([]);
				expect(authorisation.checkPermission).toBeCalledWith(user, course, context);
			});

			it('should pass authorisation check without destination course', async () => {
				const { course, user, task, userId } = setup();

				await uc.copyTask(user.id, task.id, { userId });

				const context = AuthorizationContextBuilder.write([]);
				expect(authorisation.hasPermission).not.toBeCalledWith(user, course, context);
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
					config.featureCopyServiceEnabled = true;

					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId();
					const lesson = lessonFactory.buildWithId({ course });
					const task = taskFactory.buildWithId();

					taskRepo.findById.mockResolvedValueOnce(task);
					authorisation.hasPermission.mockReturnValueOnce(false);

					const parentParams: TaskCopyParentParams = {
						courseId: course.id,
						lessonId: lesson.id,
						userId: new ObjectId().toHexString(),
					};

					return { user, course, lesson, task, parentParams };
				};

				it('should throw NotFoundException', async () => {
					const { user, task, parentParams } = setupWithTaskForbidden();

					await expect(uc.copyTask(user.id, task.id, parentParams)).rejects.toThrowError(
						new NotFoundException('could not find task to copy')
					);
				});
			});

			describe('when access to course is forbidden', () => {
				const setupWithCourseForbidden = () => {
					config.featureCopyServiceEnabled = true;

					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId();
					const task = taskFactory.buildWithId();

					taskRepo.findById.mockResolvedValueOnce(task);
					courseService.findById.mockResolvedValueOnce(course);
					authorisation.hasPermission.mockReturnValueOnce(true).mockReturnValueOnce(true);
					authorisation.checkPermission.mockImplementationOnce(() => {
						throw new ForbiddenException();
					});

					const parentParams: TaskCopyParentParams = { courseId: course.id, userId: new ObjectId().toHexString() };

					return {
						userId: user.id,
						taskId: task.id,
						parentParams,
					};
				};

				it('should throw Forbidden Exception', async () => {
					const { userId, taskId, parentParams } = setupWithCourseForbidden();

					await expect(uc.copyTask(userId, taskId, parentParams)).rejects.toThrowError(new ForbiddenException());
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
				config.featureCopyServiceEnabled = true;

				const user = userFactory.buildWithId();
				const course = courseEntityFactory.buildWithId();
				const lesson = lessonFactory.buildWithId({ course });
				const task = taskFactory.buildWithId();

				taskRepo.findById.mockResolvedValueOnce(task);
				courseService.findById.mockResolvedValueOnce(course);
				lessonService.findById.mockResolvedValueOnce(lesson);
				// first canReadTask > second canWriteLesson
				authorisation.hasPermission.mockReturnValueOnce(true).mockReturnValueOnce(false);

				const parentParams: TaskCopyParentParams = { lessonId: lesson.id, userId: new ObjectId().toHexString() };

				return {
					userId: user.id,
					taskId: task.id,
					parentParams,
				};
			};

			it('should throw Forbidden Exception', async () => {
				const { userId, taskId, parentParams } = setupWithLessonForbidden();

				await expect(uc.copyTask(userId, taskId, parentParams)).rejects.toThrowError(
					new ForbiddenException('you dont have permission to add to this lesson')
				);
			});
		});
	});
});
