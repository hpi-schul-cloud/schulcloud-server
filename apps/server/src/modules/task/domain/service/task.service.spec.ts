import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { User } from '@modules/user/repo';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { Submission, Task, TaskRepo } from '../../repo';
import { submissionFactory, taskFactory } from '../../testing';
import { SubmissionService } from './submission.service';
import { TaskService } from './task.service';

describe('TaskService', () => {
	let module: TestingModule;
	let taskRepo: DeepMocked<TaskRepo>;
	let taskService: TaskService;
	let submissionService: DeepMocked<SubmissionService>;
	let fileStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;

	beforeAll(async () => {
		await setupEntities([User, Task, Submission, CourseEntity, CourseGroupEntity, LessonEntity, Material]);

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
			],
		}).compile();

		taskRepo = module.get(TaskRepo);
		taskService = module.get(TaskService);
		submissionService = module.get(SubmissionService);
		fileStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
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
});
