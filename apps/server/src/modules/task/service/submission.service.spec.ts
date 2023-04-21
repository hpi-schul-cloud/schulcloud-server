import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Counted, Submission } from '@shared/domain';
import { FileRecordParentType } from '@shared/infra/rabbitmq';
import { SubmissionRepo, TaskRepo } from '@shared/repo';
import { setupEntities, submissionFactory, taskFactory, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization';
import { FileDto, FileParamBuilder, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { SubmissionService } from './submission.service';

describe('Submission Service', () => {
	let module: TestingModule;
	let service: SubmissionService;
	let taskRepo: DeepMocked<TaskRepo>;
	let submissionRepo: DeepMocked<SubmissionRepo>;
	let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;
	let authorizationService: DeepMocked<AuthorizationService>;

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
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		service = module.get(SubmissionService);
		submissionRepo = module.get(SubmissionRepo);
		taskRepo = module.get(TaskRepo);
		filesStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
		authorizationService = module.get(AuthorizationService);
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

	describe('findByUserAndTask is called', () => {
		const createParams = () => {
			const task = taskFactory.buildWithId();
			const otherTask = taskFactory.buildWithId();
			const user = userFactory.buildWithId();

			const submission1 = submissionFactory.buildWithId({ task, student: user });
			const submission2 = submissionFactory.buildWithId({ task: otherTask, student: user });
			const submissions = [submission1, submission2];
			const countedSubmissions: Counted<Submission[]> = [submissions, 2];

			return { task, user, countedSubmissions };
		};

		describe('WHEN repo returns successfully', () => {
			const setup = () => {
				const { task, user, countedSubmissions } = createParams();

				submissionRepo.findAllByUserId.mockResolvedValueOnce(countedSubmissions);

				return { taskId: task.id, userId: user.id, countedSubmissions };
			};

			it('should call findAllByTaskIds', async () => {
				const { taskId, userId } = setup();

				await service.findByUserAndTask(userId, taskId);

				expect(submissionRepo.findAllByUserId).toHaveBeenCalledWith(userId);
			});

			it('should return correct submissions', async () => {
				const { taskId, userId, countedSubmissions } = setup();

				const result = await service.findByUserAndTask(userId, taskId);

				const [submissions] = countedSubmissions;
				const expectedSubmissions = [submissions[0]];
				expect(result).toEqual(expectedSubmissions);
			});
		});

		describe('WHEN repo throws error', () => {
			const setup = () => {
				const { task, user, countedSubmissions } = createParams();
				const error = new Error();

				submissionRepo.findAllByUserId.mockRejectedValueOnce(error);

				return { taskId: task.id, userId: user.id, countedSubmissions, error };
			};

			it('should pass error', async () => {
				const { taskId, userId, error } = setup();

				await expect(service.findByUserAndTask(userId, taskId)).rejects.toThrow(error);
			});
		});
	});

	describe('delete is called', () => {
		describe('delets successfully', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();
				const params = FileParamBuilder.build(submission.school.id, submission);
				const fileDto = new FileDto({
					id: 'id',
					name: 'name',
					parentType: FileRecordParentType.Submission,
					parentId: 'parentId',
				});

				filesStorageClientAdapterService.deleteFilesOfParent.mockResolvedValueOnce([fileDto]);
				submissionRepo.delete.mockResolvedValueOnce();

				return { submission, params };
			};

			it('should resolve successfully', async () => {
				const { submission, params } = setup();

				await service.delete(submission);

				expect(filesStorageClientAdapterService.deleteFilesOfParent).toHaveBeenCalledWith(params);
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
				const params = FileParamBuilder.build(submission.school.id, submission);
				const fileDto = new FileDto({
					id: 'id',
					name: 'name',
					parentType: FileRecordParentType.Submission,
					parentId: 'parentId',
				});
				const error = new Error();

				filesStorageClientAdapterService.deleteFilesOfParent.mockResolvedValueOnce([fileDto]);
				submissionRepo.delete.mockRejectedValueOnce(error);

				return { submission, params, error };
			};

			it('should pass error', async () => {
				const { submission, error } = setup();

				await expect(service.delete(submission)).rejects.toThrow(error);
			});
		});
	});

	describe('createEmptySubmissionForUser is called', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.buildWithId({ users: [user] });
			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
			taskRepo.findById.mockResolvedValueOnce(task);

			return { user, task };
		};

		it('should save the submission for beta task', async () => {
			const { user, task } = setup();
			const submissionMock = {
				school: user.school,
				task,
				student: user,
				comment: '',
				submitted: true,
			};
			await service.createEmptySubmissionForUser(user, task);
			expect(submissionRepo.save).toHaveBeenCalledWith(expect.objectContaining({ ...submissionMock }));
		});
		it('should return the submission', async () => {
			const { user, task } = setup();
			const submissionMock = {
				school: user.school,
				task,
				student: user,
				comment: '',
				submitted: true,
			};
			const result = await service.createEmptySubmissionForUser(user, task);
			expect(result).toEqual(expect.objectContaining(submissionMock));
			expect(result).toBeInstanceOf(Submission);
		});
	});
});
