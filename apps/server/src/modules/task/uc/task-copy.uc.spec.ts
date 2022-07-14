import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Actions, CopyHelperService, PermissionTypes, TaskCopyService, User } from '@shared/domain';
import { CopyElementType, CopyStatusEnum } from '@shared/domain/types';
import { CourseRepo, TaskRepo, UserRepo } from '@shared/repo';
import { courseFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { TaskCopyUC } from './task-copy.uc';

describe('task copy uc', () => {
	let orm: MikroORM;
	let uc: TaskCopyUC;
	let userRepo: DeepMocked<UserRepo>;
	let taskRepo: DeepMocked<TaskRepo>;
	let courseRepo: DeepMocked<CourseRepo>;
	let authorisation: DeepMocked<AuthorizationService>;
	let taskCopyService: DeepMocked<TaskCopyService>;
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
			authorisation.getUserWithPermissions.mockResolvedValue(user);
			taskRepo.findById.mockResolvedValue(task);
			taskRepo.findAllByParentIds.mockResolvedValue([allTasks, allTasks.length]);
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
			return {
				user,
				course,
				task,
				copyName,
				copy,
				allTasks,
				status,
			};
		};

		describe('status', () => {
			it('should return status', async () => {
				const { course, user, task, status } = setup();
				const result = await uc.copyTask(user.id, task.id, { courseId: course.id });
				expect(result).toEqual(status);
			});
		});

		describe('repos', () => {
			it('should fetch correct user', async () => {
				const { course, user, task } = setup();
				await uc.copyTask(user.id, task.id, { courseId: course.id });
				expect(authorisation.getUserWithPermissions).toBeCalledWith(user.id);
			});

			it('should fetch correct task', async () => {
				const { course, user, task } = setup();
				await uc.copyTask(user.id, task.id, { courseId: course.id });
				expect(taskRepo.findById).toBeCalledWith(task.id);
			});

			it('should fetch destination course', async () => {
				const { course, user, task } = setup();
				await uc.copyTask(user.id, task.id, { courseId: course.id });
				expect(courseRepo.findById).toBeCalledWith(course.id);
			});

			it('should pass without destination course', async () => {
				const { user, task } = setup();
				await uc.copyTask(user.id, task.id, {});
				expect(courseRepo.findById).not.toHaveBeenCalled();
			});

			it('should persist copy', async () => {
				const { course, user, task, copy } = setup();
				await uc.copyTask(user.id, task.id, { courseId: course.id });
				expect(taskRepo.save).toBeCalledWith(copy);
			});
		});

		describe('permissions', () => {
			it('should check authorisation for task', async () => {
				const { course, user, task } = setup();
				await uc.copyTask(user.id, task.id, { courseId: course.id });
				expect(authorisation.hasPermission).toBeCalledWith(user, task, {
					action: Actions.read,
					requiredPermissions: [],
				});
			});

			it('should check authorisation for destination course', async () => {
				const { course, user, task } = setup();
				await uc.copyTask(user.id, task.id, { courseId: course.id });
				expect(authorisation.hasPermission).toBeCalledWith(user, course, {
					action: Actions.write,
					requiredPermissions: [],
				});
			});

			it('should pass authorisation check without destination course', async () => {
				const { course, user, task } = setup();
				await uc.copyTask(user.id, task.id, {});
				expect(authorisation.hasPermission).not.toBeCalledWith(user, course, {
					action: Actions.write,
					requiredPermissions: [],
				});
			});

			describe('when access to task is forbidden', () => {
				const setupWithTaskForbidden = () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId();
					const task = taskFactory.buildWithId();
					userRepo.findById.mockResolvedValue(user);
					taskRepo.findById.mockResolvedValue(task);
					authorisation.hasPermission.mockImplementation((u: User, e: PermissionTypes) => e !== task);
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
					userRepo.findById.mockResolvedValue(user);
					taskRepo.findById.mockResolvedValue(task);
					courseRepo.findById.mockResolvedValue(course);
					authorisation.hasPermission.mockImplementation((u: User, e: PermissionTypes) => e !== course);
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

		describe('derive copy name', () => {
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
				const { course, user, task, copyName } = setup();
				await uc.copyTask(user.id, task.id, { courseId: course.id });
				expect(taskCopyService.copyTaskMetadata).toBeCalledWith({
					originalTask: task,
					destinationCourse: course,
					user,
					copyName,
				});
			});
		});
	});
});
