import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { FileRecordParentType } from '@infra/rabbitmq';
import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Test, TestingModule } from '@nestjs/testing';
import { Submission } from '@shared/domain/entity';
import { Counted } from '@shared/domain/types';
import { SubmissionRepo } from '@shared/repo';
import { setupEntities, submissionFactory, taskFactory, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { ObjectId } from '@mikro-orm/mongodb';
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
				{
					provide: Logger,
					useValue: createMock<Logger>(),
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

	describe('deleteSingleSubmissionsOwnedByUser', () => {
		describe('when submission with specified userId was not found ', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();

				submissionRepo.findAllByUserId.mockResolvedValueOnce([[], 0]);

				return { submission };
			};

			it('should return deletedSubmissions number of 0', async () => {
				const { submission } = setup();

				const result = await service.deleteSingleSubmissionsOwnedByUser(new ObjectId().toString());

				expect(result.count).toEqual(0);
				expect(result.refs.length).toEqual(0);
				expect(submission).toBeDefined();
			});
		});

		describe('when submission with specified userId was found ', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ student: user, teamMembers: [user] });

				submissionRepo.findAllByUserId.mockResolvedValueOnce([[submission], 1]);
				submissionRepo.delete.mockResolvedValueOnce();

				return { submission, user };
			};

			it('should return deletedSubmissions number of 1', async () => {
				const { submission, user } = setup();

				const result = await service.deleteSingleSubmissionsOwnedByUser(user.id);

				expect(result.count).toEqual(1);
				expect(result.refs.length).toEqual(1);
				expect(submissionRepo.delete).toBeCalledTimes(1);
				expect(submissionRepo.delete).toHaveBeenCalledWith([submission]);
			});
		});
	});

	describe('removeUserReferencesFromSubmissions', () => {
		describe('when submission with specified userId was not found ', () => {
			const setup = () => {
				const user1 = userFactory.buildWithId();
				const user2 = userFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ student: user1, teamMembers: [user1, user2] });

				submissionRepo.findAllByUserId.mockResolvedValueOnce([[], 0]);

				return { submission, user1, user2 };
			};

			it('should return updated submission number of 0', async () => {
				const { submission, user1 } = setup();

				const result = await service.removeUserReferencesFromSubmissions(new ObjectId().toString());

				expect(result.count).toEqual(0);
				expect(result.refs.length).toEqual(0);
				expect(submission.student).toEqual(user1);
				expect(submission.teamMembers.length).toEqual(2);
			});
		});

		describe('when submission with specified userId was found ', () => {
			const setup = () => {
				const user1 = userFactory.buildWithId();
				const user2 = userFactory.buildWithId();
				const submission = submissionFactory.buildWithId({
					student: user1,
					teamMembers: [user1, user2],
				});

				submissionRepo.findAllByUserId.mockResolvedValueOnce([[submission], 1]);
				submissionRepo.delete.mockResolvedValueOnce();

				return { submission, user1, user2 };
			};

			it('should return updated submission number of 1', async () => {
				const { submission, user1, user2 } = setup();

				const result = await service.removeUserReferencesFromSubmissions(user1.id);

				expect(result.count).toEqual(1);
				expect(result.refs.length).toEqual(1);
				expect(submission.student).toBeUndefined();
				expect(submission.teamMembers.length).toEqual(1);
				expect(submission.teamMembers[0]).toEqual(user2);
				expect(submissionRepo.save).toBeCalledTimes(1);
				expect(submissionRepo.save).toHaveBeenCalledWith([submission]);
			});
		});
	});
});
