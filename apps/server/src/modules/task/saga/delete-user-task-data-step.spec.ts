import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { LessonEntity, Material } from '@modules/lesson/repo';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
} from '@modules/saga';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { TaskService } from '..';
import { Submission, Task, TaskRepo } from '../repo';
import { taskFactory } from '../testing';
import { DeleteUserTaskDataStep } from './delete-user-task-data.step';

describe(DeleteUserTaskDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserTaskDataStep;
	let taskRepo: DeepMocked<TaskRepo>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities([User, Task, Submission, CourseEntity, CourseGroupEntity, LessonEntity, Material]);

		module = await Test.createTestingModule({
			providers: [
				DeleteUserTaskDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: TaskService,
					useValue: createMock<TaskService>(),
				},
				{
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserTaskDataStep);
		taskRepo = module.get(TaskRepo);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserTaskDataStep(
				sagaService,
				createMock<TaskService>(),
				createMock<TaskRepo>(),
				createMock<Logger>()
			);

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.TASK, step);
		});
	});

	describe('deleteTasksByOnlyCreator', () => {
		describe('when task has only user as parent', () => {
			const setup = () => {
				const creator = userFactory.buildWithId();
				const taskWithoutCourse = taskFactory.buildWithId({ creator });

				taskRepo.findByOnlyCreatorId.mockResolvedValue([[taskWithoutCourse], 1]);

				const expectedResult = StepOperationReportBuilder.build(StepOperationType.DELETE, 1, [taskWithoutCourse.id]);
				return { creator, expectedResult };
			};

			it('should call taskRepo.findByOnlyCreatorId with creatorId', async () => {
				const { creator } = setup();

				await step.deleteTasksByOnlyCreator(creator.id);

				expect(taskRepo.findByOnlyCreatorId).toBeCalledWith(creator.id);
			});

			it('should return the object with information on the actions performed', async () => {
				const { creator, expectedResult } = setup();

				const result = await step.deleteTasksByOnlyCreator(creator.id);

				expect(result).toEqual(expectedResult);
			});
		});
	});

	describe('removeCreatorIdFromTasks', () => {
		describe('when tasks where user is parent, and when task has course', () => {
			const setup = () => {
				const creator = userFactory.buildWithId();
				const course = courseEntityFactory.build();
				const taskWithCourse = taskFactory.buildWithId({ creator, course });

				taskRepo.findByCreatorIdWithCourseAndLesson.mockResolvedValue([[taskWithCourse], 1]);

				const expectedResult = StepOperationReportBuilder.build(StepOperationType.UPDATE, 1, [taskWithCourse.id]);
				const taskWithCourseToUpdate = { ...taskWithCourse, creator: undefined };

				return { creator, expectedResult, taskWithCourseToUpdate };
			};

			it('should call taskRepo.findByCreatorIdWithCourseAndLesson with creatorId', async () => {
				const { creator } = setup();

				await step.removeCreatorIdFromTasks(creator.id);

				expect(taskRepo.findByCreatorIdWithCourseAndLesson).toBeCalledWith(creator.id);
			});

			it('should call taskRepo.save with task to update', async () => {
				const { creator, taskWithCourseToUpdate } = setup();

				await step.removeCreatorIdFromTasks(creator.id);

				expect(taskRepo.save).toBeCalledWith([taskWithCourseToUpdate]);
			});

			it('should return the object with information on the actions performed', async () => {
				const { creator, expectedResult } = setup();

				const result = await step.removeCreatorIdFromTasks(creator.id);

				expect(result).toEqual(expectedResult);
			});
		});
	});

	describe('removeUserFromFinished', () => {
		describe('when task has user in finished array', () => {
			const setup = () => {
				const creator = userFactory.buildWithId();
				const finishedTask = taskFactory.finished(creator).buildWithId();

				taskRepo.findByUserIdInFinished.mockResolvedValue([[finishedTask], 1]);

				const expectedResult = StepOperationReportBuilder.build(StepOperationType.UPDATE, 1, [finishedTask.id]);

				return { creator, expectedResult };
			};

			it('should call taskRepo.findByUserIdInFinished with creatorId', async () => {
				const { creator } = setup();

				await step.removeUserFromFinished(creator.id);

				expect(taskRepo.findByUserIdInFinished).toBeCalledWith(creator.id);
			});

			it('should return the object with information on the actions performed', async () => {
				const { creator, expectedResult } = setup();

				const result = await step.removeUserFromFinished(creator.id);

				expect(result).toEqual(expectedResult);
			});
		});
	});

	describe('execute', () => {
		const setup = () => {
			const creator = userFactory.buildWithId();
			const taskWithoutCourse = taskFactory.buildWithId({ creator });
			const course = courseEntityFactory.build();
			const taskWithCourse = taskFactory.buildWithId({ creator, course });
			const finishedTask = taskFactory.finished(creator).buildWithId();

			taskRepo.findByOnlyCreatorId.mockResolvedValue([[taskWithoutCourse], 1]);
			taskRepo.findByCreatorIdWithCourseAndLesson.mockResolvedValue([[taskWithCourse], 1]);
			taskRepo.findByUserIdInFinished.mockResolvedValue([[finishedTask], 1]);

			const expectedResultByOnlyCreator = StepOperationReportBuilder.build(StepOperationType.DELETE, 1, [
				taskWithoutCourse.id,
			]);

			const expectedResultWithCreatorInTask = StepOperationReportBuilder.build(StepOperationType.UPDATE, 1, [
				taskWithCourse.id,
			]);

			const expectedResultForFinishedTask = StepOperationReportBuilder.build(StepOperationType.UPDATE, 1, [
				finishedTask.id,
			]);

			const expectedResult = StepReportBuilder.build(ModuleName.TASK, [
				StepOperationReportBuilder.build(StepOperationType.DELETE, 1, [taskWithoutCourse.id]),
				StepOperationReportBuilder.build(StepOperationType.UPDATE, 2, [taskWithCourse.id, finishedTask.id]),
			]);

			return {
				creator,
				expectedResultByOnlyCreator,
				expectedResultWithCreatorInTask,
				expectedResultForFinishedTask,
				expectedResult,
			};
		};

		it('should call deleteTasksByOnlyCreator with userId', async () => {
			const { creator, expectedResultByOnlyCreator } = setup();
			jest.spyOn(step, 'deleteTasksByOnlyCreator').mockResolvedValueOnce(expectedResultByOnlyCreator);

			await step.execute({ userId: creator.id });

			expect(step.deleteTasksByOnlyCreator).toHaveBeenCalledWith(creator.id);
		});

		it('should call removeCreatorIdFromTasks with userId', async () => {
			const { creator, expectedResultWithCreatorInTask } = setup();
			jest.spyOn(step, 'removeCreatorIdFromTasks').mockResolvedValueOnce(expectedResultWithCreatorInTask);

			await step.execute({ userId: creator.id });

			expect(step.removeCreatorIdFromTasks).toHaveBeenCalledWith(creator.id);
		});

		it('should call removeUserFromFinished with userId', async () => {
			const { creator, expectedResultForFinishedTask } = setup();
			jest.spyOn(step, 'removeUserFromFinished').mockResolvedValueOnce(expectedResultForFinishedTask);

			await step.execute({ userId: creator.id });

			expect(step.removeUserFromFinished).toHaveBeenCalledWith(creator.id);
		});

		it('should return domainOperation object with information about deleted user data', async () => {
			const {
				creator,
				expectedResult,
				expectedResultForFinishedTask,
				expectedResultWithCreatorInTask,
				expectedResultByOnlyCreator,
			} = setup();

			jest.spyOn(step, 'removeUserFromFinished').mockResolvedValueOnce(expectedResultForFinishedTask);
			jest.spyOn(step, 'removeCreatorIdFromTasks').mockResolvedValueOnce(expectedResultWithCreatorInTask);
			jest.spyOn(step, 'deleteTasksByOnlyCreator').mockResolvedValueOnce(expectedResultByOnlyCreator);

			const result = await step.execute({ userId: creator.id });

			expect(result).toEqual(expectedResult);
		});
	});
});
