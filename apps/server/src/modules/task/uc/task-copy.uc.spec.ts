import { createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CopyElementType, CopyStatusEnum } from '@shared/domain/types';
import { Actions, PermissionTypes, User } from '../../../shared/domain';
import { TaskCopyParams, TaskCopyService } from '../../../shared/domain/service/task-copy.service';
import { CourseRepo, TaskRepo, UserRepo } from '../../../shared/repo';
import { courseFactory, setupEntities, taskFactory, userFactory } from '../../../shared/testing';
import { AuthorizationService } from '../../authorization';
import { TaskCopyUC } from './task-copy.uc';

describe('task copy uc', () => {
	let orm: MikroORM;
	let uc: TaskCopyUC;
	let userRepo: UserRepo;
	let taskRepo: TaskRepo;
	let courseRepo: CourseRepo;
	let authorisation: AuthorizationService;
	let taskCopyService: TaskCopyService;

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
			],
		}).compile();

		uc = module.get(TaskCopyUC);
		userRepo = module.get(UserRepo);
		taskRepo = module.get(TaskRepo);
		authorisation = module.get(AuthorizationService);
		courseRepo = module.get(CourseRepo);
		taskCopyService = module.get(TaskCopyService);
	});

	describe('copy task', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId({ teachers: [user] });
			const task = taskFactory.buildWithId();
			const userSpy = jest
				.spyOn(authorisation, 'getUserWithPermissions')
				.mockImplementation(() => Promise.resolve(user));
			const taskSpy = jest.spyOn(taskRepo, 'findById').mockImplementation(() => Promise.resolve(task));
			const courseSpy = jest.spyOn(courseRepo, 'findById').mockImplementation(() => Promise.resolve(course));
			const authSpy = jest.spyOn(authorisation, 'hasPermission').mockImplementation(() => true);
			const copy = taskFactory.buildWithId({ creator: user, course });
			const status = {
				title: 'taskCopy',
				type: CopyElementType.TASK,
				status: CopyStatusEnum.SUCCESS,
			};
			const taskCopySpy = jest
				.spyOn(taskCopyService, 'copyTaskMetadata')
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((params: TaskCopyParams) => ({
					copy,
					status,
				}));
			const taskPersistSpy = jest.spyOn(taskRepo, 'save');
			return { user, course, task, userSpy, taskSpy, courseSpy, authSpy, copy, status, taskCopySpy, taskPersistSpy };
		};

		it('should fetch correct user', async () => {
			const { course, user, task, userSpy } = setup();
			await uc.copyTask(user.id, task.id, { courseId: course.id });
			expect(userSpy).toBeCalledWith(user.id);
		});

		it('should fetch correct task', async () => {
			const { course, user, task, taskSpy } = setup();
			await uc.copyTask(user.id, task.id, { courseId: course.id });
			expect(taskSpy).toBeCalledWith(task.id);
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

		it('should call copy service', async () => {
			const { course, user, task, taskCopySpy } = setup();
			await uc.copyTask(user.id, task.id, { courseId: course.id });
			expect(taskCopySpy).toBeCalledWith({ originalTask: task, destinationCourse: course, user });
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
