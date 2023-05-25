import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Counted, Submission } from '@shared/domain';
import { FileRecordParentType } from '@shared/infra/rabbitmq';
import { SubmissionRepo } from '@shared/repo';
import { setupEntities, submissionFactory, taskFactory } from '@shared/testing';
import { FileDto, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { SubmissionService } from './submission.service';

describe('Submission Service', () => {
	let module: TestingModule;
	let service: SubmissionService;
	let submissionRepo: DeepMocked<SubmissionRepo>;
	let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			imports: [],
			providers: [
				SubmissionService,
				{
					provide: SubmissionRepo,
					useValue: createMock<SubmissionRepo>(),
				},
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
			],
		}).compile();

		service = module.get(SubmissionService);
		submissionRepo = module.get(SubmissionRepo);
		filesStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findById is called', () => {
		describe('repo returns successfully', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();

				submissionRepo.findById.mockResolvedValueOnce(submission);

				return { submission };
			};

			it('should return submission', async () => {
				const { submission } = setup();

				const result = await service.findById(submission.id);

				expect(submissionRepo.findById).toHaveBeenCalledWith(submission.id);
				expect(result).toEqual(submission);
			});
		});

		describe('repo returns error', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();
				const error = new Error();

				submissionRepo.findById.mockRejectedValue(error);

				return { submission, error };
			};

			it('should pass error', async () => {
				const { submission, error } = setup();

				await expect(service.findById(submission.id)).rejects.toThrow(error);
			});
		});
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

	describe('delete is called', () => {
		describe('delets successfully', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();
				const fileDto = new FileDto({
					id: 'id',
					name: 'name',
					parentType: FileRecordParentType.Submission,
					parentId: 'parentId',
				});

				filesStorageClientAdapterService.deleteFilesOfParent.mockResolvedValueOnce([fileDto]);
				submissionRepo.delete.mockResolvedValueOnce();

				return { submission };
			};

			it('should resolve successfully', async () => {
				const { submission } = setup();

				await service.delete(submission);

				expect(filesStorageClientAdapterService.deleteFilesOfParent).toHaveBeenCalledWith(submission.id);
				expect(submissionRepo.delete).toHaveBeenCalledWith(submission);
			});
		});

		describe('deleteFilesOfParent rejects with error', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();
				const error = new Error();

				filesStorageClientAdapterService.deleteFilesOfParent.mockRejectedValueOnce(error);

				return { submission, error };
			};

			it('should pass error', async () => {
				const { submission, error } = setup();

				await expect(service.delete(submission)).rejects.toThrow(error);
			});
		});

		describe('submissionRepo rejects with error', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();
				const fileDto = new FileDto({
					id: 'id',
					name: 'name',
					parentType: FileRecordParentType.Submission,
					parentId: 'parentId',
				});
				const error = new Error();

				filesStorageClientAdapterService.deleteFilesOfParent.mockResolvedValueOnce([fileDto]);
				submissionRepo.delete.mockRejectedValueOnce(error);

				return { submission, error };
			};

			it('should pass error', async () => {
				const { submission, error } = setup();

				await expect(service.delete(submission)).rejects.toThrow(error);
			});
		});
	});
});
