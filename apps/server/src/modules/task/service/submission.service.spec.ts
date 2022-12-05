import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Counted, Submission } from '@shared/domain';
import { SubmissionRepo } from '@shared/repo';
import { setupEntities, submissionFactory, taskFactory } from '@shared/testing';
import { SubmissionService } from './submission.service';

describe('Submission Service', () => {
	let module: TestingModule;
	let service: SubmissionService;
	let submissionRepo: DeepMocked<SubmissionRepo>;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			imports: [],
			providers: [
				SubmissionService,
				{
					provide: SubmissionRepo,
					useValue: createMock<SubmissionRepo>(),
				},
			],
		}).compile();

		service = module.get(SubmissionService);
		submissionRepo = module.get(SubmissionRepo);
	});

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findAllByTask is called', () => {
		const createParams = () => {
			const task = taskFactory.buildWithId();

			const submission1 = submissionFactory.buildWithId();
			const submission2 = submissionFactory.buildWithId();
			const submissions = [submission1, submission2];
			const countedSubmissions: Counted<Submission[]> = [submissions, 2];

			return { task, countedSubmissions };
		};

		describe('WHEN repo returns successfully', () => {
			const setup = () => {
				const { task, countedSubmissions } = createParams();

				submissionRepo.findAllByTaskIds.mockResolvedValueOnce(countedSubmissions);

				return { taskId: task.id, countedSubmissions };
			};

			it('should call findAllByTaskIds', async () => {
				const { taskId } = setup();

				await service.findAllByTask(taskId);

				expect(submissionRepo.findAllByTaskIds).toHaveBeenCalledWith([taskId]);
			});

			it('should return submissions', async () => {
				const { taskId, countedSubmissions } = setup();

				const result = await service.findAllByTask(taskId);

				expect(result).toEqual(countedSubmissions);
			});
		});

		describe('WHEN repo throws error', () => {
			const setup = () => {
				const { task, countedSubmissions } = createParams();
				const error = new Error();

				submissionRepo.findAllByTaskIds.mockRejectedValueOnce(error);

				return { taskId: task.id, countedSubmissions, error };
			};

			it('should pass error', async () => {
				const { taskId, error } = setup();

				await expect(service.findAllByTask(taskId)).rejects.toThrow(error);
			});
		});
	});
});
