import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskRepo } from '@shared/repo';
import { courseFactory, setupEntities, submissionFactory, taskFactory, userFactory } from '@shared/testing';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { DomainName, OperationType } from '@shared/domain/types';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '@shared/domain/builder';
import { Logger } from '@src/core/logger';
import { EventBus } from '@nestjs/cqrs';
import { ObjectId } from 'bson';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { DataDeletedEvent } from '@modules/deletion/event';
import { TaskService } from './task.service';
import { SubmissionService } from './submission.service';

describe('TaskService', () => {
	let module: TestingModule;
	let taskRepo: DeepMocked<TaskRepo>;
	let taskService: TaskService;
	let submissionService: DeepMocked<SubmissionService>;
	let fileStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TaskService,
				{
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},
				{
					provide: SubmissionService,
					useValue: createMock<SubmissionService>(),
				},
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: EventBus,
					useValue: {
						publish: jest.fn(),
					},
				},
			],
		}).compile();

		taskRepo = module.get(TaskRepo);
		taskService = module.get(TaskService);
		submissionService = module.get(SubmissionService);
		fileStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
		eventBus = module.get(EventBus);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('findBySingleParent', () => {
		it('should call findBySingleParent from task repo', async () => {
			const courseId = 'courseId';
			const userId = 'user-id';
			taskRepo.findBySingleParent.mockResolvedValueOnce([[], 0]);

			await expect(taskService.findBySingleParent(userId, courseId)).resolves.toEqual([[], 0]);
			expect(taskRepo.findBySingleParent).toBeCalledWith(userId, courseId, undefined, undefined);
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

			expect(fileStorageClientAdapterService.deleteFilesOfParent).toBeCalledWith(task.id);
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

	describe('deleteTasksByOnlyCreator', () => {
		describe('when task has only user as parent', () => {
			const setup = () => {
				const creator = userFactory.buildWithId();
				const taskWithoutCourse = taskFactory.buildWithId({ creator });

				taskRepo.findByOnlyCreatorId.mockResolvedValue([[taskWithoutCourse], 1]);

				const expectedResult = DomainOperationReportBuilder.build(OperationType.DELETE, 1, [taskWithoutCourse.id]);
				return { creator, expectedResult };
			};

			it('should call taskRepo.findByOnlyCreatorId with creatorId', async () => {
				const { creator } = setup();

				await taskService.deleteTasksByOnlyCreator(creator.id);

				expect(taskRepo.findByOnlyCreatorId).toBeCalledWith(creator.id);
			});

			it('should return the object with information on the actions performed', async () => {
				const { creator, expectedResult } = setup();

				const result = await taskService.deleteTasksByOnlyCreator(creator.id);

				expect(result).toEqual(expectedResult);
			});
		});
	});

	describe('removeCreatorIdFromTasks', () => {
		describe('when tasks where user is parent, and when task has course', () => {
			const setup = () => {
				const creator = userFactory.buildWithId();
				const course = courseFactory.build();
				const taskWithCourse = taskFactory.buildWithId({ creator, course });

				taskRepo.findByCreatorIdWithCourseAndLesson.mockResolvedValue([[taskWithCourse], 1]);

				const expectedResult = DomainOperationReportBuilder.build(OperationType.UPDATE, 1, [taskWithCourse.id]);
				const taskWithCourseToUpdate = { ...taskWithCourse, creator: undefined };

				return { creator, expectedResult, taskWithCourseToUpdate };
			};

			it('should call taskRepo.findByCreatorIdWithCourseAndLesson with creatorId', async () => {
				const { creator } = setup();

				await taskService.removeCreatorIdFromTasks(creator.id);

				expect(taskRepo.findByCreatorIdWithCourseAndLesson).toBeCalledWith(creator.id);
			});

			it('should call taskRepo.save with task to update', async () => {
				const { creator, taskWithCourseToUpdate } = setup();

				await taskService.removeCreatorIdFromTasks(creator.id);

				expect(taskRepo.save).toBeCalledWith([taskWithCourseToUpdate]);
			});

			it('should return the object with information on the actions performed', async () => {
				const { creator, expectedResult } = setup();

				const result = await taskService.removeCreatorIdFromTasks(creator.id);

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

				const expectedResult = DomainOperationReportBuilder.build(OperationType.UPDATE, 1, [finishedTask.id]);

				return { creator, expectedResult };
			};

			it('should call taskRepo.findByUserIdInFinished with creatorId', async () => {
				const { creator } = setup();

				await taskService.removeUserFromFinished(creator.id);

				expect(taskRepo.findByUserIdInFinished).toBeCalledWith(creator.id);
			});

			it('should return the object with information on the actions performed', async () => {
				const { creator, expectedResult } = setup();

				const result = await taskService.removeUserFromFinished(creator.id);

				expect(result).toEqual(expectedResult);
			});
		});
	});

	describe('handle', () => {
		const setup = () => {
			const targetRefId = new ObjectId().toHexString();
			const targetRefDomain = DomainName.TASK;
			const deletionRequest = deletionRequestFactory.build({ targetRefId, targetRefDomain });

			const expectedData = DomainDeletionReportBuilder.build(DomainName.TASK, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
				]),
			]);

			return {
				deletionRequest,
				expectedData,
			};
		};

		describe('when UserDeletedEvent', () => {
			it('should call deleteUserData in classService', async () => {
				const { deletionRequest, expectedData } = setup();

				jest.spyOn(taskService, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await taskService.handle({ deletionRequest });

				expect(taskService.deleteUserData).toHaveBeenCalledWith(deletionRequest.targetRefId);
			});

			it('should call eventBus.publish', async () => {
				const { deletionRequest, expectedData } = setup();

				jest.spyOn(taskService, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await taskService.handle({ deletionRequest });

				expect(eventBus.publish).toHaveBeenCalledWith(new DataDeletedEvent(deletionRequest, expectedData));
			});
		});
	});
});
