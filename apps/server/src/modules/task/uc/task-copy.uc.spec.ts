import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Actions, CopyHelperService, PermissionTypes, TaskCopyParams, TaskCopyService, User } from '@shared/domain';
import { CopyElementType, CopyStatusEnum } from '@shared/domain/types';
import { CourseRepo, TaskRepo, UserRepo } from '@shared/repo';
import { courseFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { TaskCopyUC } from './task-copy.uc';

describe('task copy uc', () => {
	let orm: MikroORM;
	let uc: TaskCopyUC;
	let userRepo: UserRepo;
	let taskRepo: DeepMocked<TaskRepo>;
	let courseRepo: CourseRepo;
	let authorisation: AuthorizationService;
	let taskCopyService: TaskCopyService;
	let copyHelperService: DeepMocked<CopyHelperService>;

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
		taskCopyService = module.get(TaskCopyService);
		copyHelperService = module.get(CopyHelperService);
	});

	describe('copy task', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId({ teachers: [user] });
			const allTasks = taskFactory.buildList(3, { course });
			const task = allTasks[0];
			const userSpy = jest
				.spyOn(authorisation, 'getUserWithPermissions')
				.mockImplementation(() => Promise.resolve(user));
			taskRepo.findById.mockResolvedValue(task);
			taskRepo.findAllByParentIds.mockResolvedValue([allTasks, allTasks.length]);
			const courseSpy = jest.spyOn(courseRepo, 'findById').mockImplementation(() => Promise.resolve(course));
			const authSpy = jest.spyOn(authorisation, 'hasPermission').mockImplementation(() => true);
			const copyName = 'name of the copy';
			copyHelperService.deriveCopyName.mockReturnValue(copyName);
			const copy = taskFactory.buildWithId({ creator: user, course });
			const status = {
				title: 'taskCopy',
				type: CopyElementType.TASK,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: copy,
			};
			const taskCopySpy = jest
				.spyOn(taskCopyService, 'copyTaskMetadata')
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((params: TaskCopyParams) => status);
			const taskPersistSpy = jest.spyOn(taskRepo, 'save');
			return {
				user,
				course,
				task,
				userSpy,
				courseSpy,
				authSpy,
				copyName,
				copy,
				status,
				taskCopySpy,
				taskPersistSpy,
				allTasks,
			};
		};

		it('should fetch correct user', async () => {
			const { course, user, task, userSpy } = setup();
			await uc.copyTask(user.id, task.id, { courseId: course.id });
			expect(userSpy).toBeCalledWith(user.id);
		});

		it('should fetch correct task', async () => {
			const { course, user, task } = setup();
			await uc.copyTask(user.id, task.id, { courseId: course.id });
			expect(taskRepo.findById).toBeCalledWith(task.id);
		});

		it('should fetch destination course', async () => {
			const { course, user, task, courseSpy } = setup();
			await uc.copyTask(user.id, task.id, { courseId: course.id });
			expect(courseSpy).toBeCalledWith(course.id);
		});

		it('should pass without destination course', async () => {
			const { user, task, courseSpy } = setup();
			await uc.copyTask(user.id, task.id, {});
			expect(courseSpy).not.toHaveBeenCalled();
		});

		it('should check authorisation for task', async () => {
			const { course, user, task, authSpy } = setup();
			await uc.copyTask(user.id, task.id, { courseId: course.id });
			expect(authSpy).toBeCalledWith(user, task, {
				action: Actions.read,
				requiredPermissions: [],
			});
		});

		it('should check authorisation for destination course', async () => {
			const { course, user, task, authSpy } = setup();
			await uc.copyTask(user.id, task.id, { courseId: course.id });
			expect(authSpy).toBeCalledWith(user, course, {
				action: Actions.write,
				requiredPermissions: [],
			});
		});

		it('should pass authorisation check without destination course', async () => {
			const { course, user, task, authSpy } = setup();
			await uc.copyTask(user.id, task.id, {});
			expect(authSpy).not.toBeCalledWith(user, course, {
				action: Actions.write,
				requiredPermissions: [],
			});
		});

		it('should derive name for copy', async () => {
			const { course, user, task, allTasks } = setup();
			await uc.copyTask(user.id, task.id, { courseId: course.id });
			const existingNames = allTasks.map((t) => t.name);
			expect(copyHelperService.deriveCopyName).toBeCalledWith(task.name, existingNames);
		});

		it('should use findAllByParentIds to determine existing task names', async () => {
			const { course, user, task } = setup();
			await uc.copyTask(user.id, task.id, { courseId: course.id });
			expect(taskRepo.findAllByParentIds).toHaveBeenCalledWith({ courseIds: [course.id] });
		});

		it('should call copy service', async () => {
			const { course, user, task, copyName, taskCopySpy } = setup();
			await uc.copyTask(user.id, task.id, { courseId: course.id });
			expect(taskCopySpy).toBeCalledWith({ originalTask: task, destinationCourse: course, user, copyName });
		});

		it('should persist copy', async () => {
			const { course, user, task, taskPersistSpy, copy } = setup();
			await uc.copyTask(user.id, task.id, { courseId: course.id });
			expect(taskPersistSpy).toBeCalledWith(copy);
		});

		it('should return status', async () => {
			const { course, user, task, status } = setup();
			const result = await uc.copyTask(user.id, task.id, { courseId: course.id });
			expect(result).toEqual(status);
		});

		describe('when access to task is forbidden', () => {
			const setupWithTaskForbidden = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const task = taskFactory.buildWithId();
				jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));
				jest.spyOn(taskRepo, 'findById').mockImplementation(() => Promise.resolve(task));
				jest.spyOn(authorisation, 'hasPermission').mockImplementation((u: User, e: PermissionTypes) => {
					if (e === task) return false;
					return true;
				});
				return { user, course, task };
			};

			it('should throw NotFoundException', async () => {
				const { course, user, task } = setupWithTaskForbidden();

				try {
					await uc.copyTask(user.id, task.id, { courseId: course.id });
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
				jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));
				jest.spyOn(taskRepo, 'findById').mockImplementation(() => Promise.resolve(task));
				jest.spyOn(courseRepo, 'findById').mockImplementation(() => Promise.resolve(course));
				jest.spyOn(authorisation, 'hasPermission').mockImplementation((u: User, e: PermissionTypes) => {
					if (e === course) return false;
					return true;
				});
				return { user, course, task };
			};

			it('should throw Forbidden Exception', async () => {
				const { course, user, task } = setupWithCourseForbidden();

				try {
					await uc.copyTask(user.id, task.id, { courseId: course.id });
					throw new Error('should have failed');
				} catch (err) {
					expect(err).toBeInstanceOf(ForbiddenException);
				}
			});
		});
	});
});
