import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Counted, Permission, PermissionContextBuilder, Submission } from '@shared/domain';
import { setupEntities, submissionFactory, taskFactory, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization';
import { SubmissionService } from '../service/submission.service';
import { SubmissionUC } from './submission.uc';

describe('Submission UC', () => {
	let module: TestingModule;
	let submissionUc: SubmissionUC;
	let submissionService: DeepMocked<SubmissionService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			imports: [],
			providers: [
				SubmissionUC,
				{
					provide: SubmissionService,
					useValue: createMock<SubmissionService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		submissionUc = module.get(SubmissionUC);
		submissionService = module.get(SubmissionService);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(submissionUc).toBeDefined();
	});

	describe('findAllByTask is called', () => {
		const createParams = () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.buildWithId();

			const submission1 = submissionFactory.buildWithId();
			const submission2 = submissionFactory.buildWithId();
			const submissions = [submission1, submission2];
			const countedSubmissions: Counted<Submission[]> = [submissions, 2];

			return { user, task, submissions, countedSubmissions };
		};

		describe('WHEN service returns successfully and user is authorized for all submissions', () => {
			const setup = () => {
				const { user, task, submissions, countedSubmissions } = createParams();

				submissionService.findAllByTask.mockResolvedValueOnce(countedSubmissions);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.hasPermission.mockReturnValue(true).mockReturnValue(true);

				return { taskId: task.id, user, submissions, countedSubmissions };
			};

			it('should call findAllByTask', async () => {
				const { user, taskId } = setup();

				await submissionUc.findAllByTask(user.id, taskId);

				expect(submissionService.findAllByTask).toHaveBeenCalledWith(taskId);
			});

			it('should call getUserWithPermissions', async () => {
				const { user, taskId } = setup();

				await submissionUc.findAllByTask(user.id, taskId);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
			});

			it('should call hasPermission', async () => {
				const { user, taskId, submissions } = setup();
				const permissionContext = PermissionContextBuilder.read([Permission.SUBMISSIONS_VIEW]);

				await submissionUc.findAllByTask(user.id, taskId);

				expect(authorizationService.hasPermission).toHaveBeenNthCalledWith(1, user, submissions[0], permissionContext);
				expect(authorizationService.hasPermission).toHaveBeenNthCalledWith(2, user, submissions[1], permissionContext);
			});

			it('should return submissions', async () => {
				const { user, taskId, submissions } = setup();

				const result = await submissionUc.findAllByTask(user.id, taskId);

				expect(result).toEqual(submissions);
			});
		});

		describe('WHEN service returns successfully and user is authorized for second submission only', () => {
			const setup = () => {
				const { user, task, submissions, countedSubmissions } = createParams();

				submissionService.findAllByTask.mockResolvedValueOnce(countedSubmissions);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.hasPermission.mockReturnValueOnce(false).mockReturnValueOnce(true);

				return { taskId: task.id, user, submissions };
			};

			it('should return only submission2', async () => {
				const { user, taskId, submissions } = setup();

				const result = await submissionUc.findAllByTask(user.id, taskId);
				const expectedResult = [submissions[1]];

				expect(result).toEqual(expectedResult);
			});
		});

		describe('WHEN service returns successfully and user is authorized for first submission only', () => {
			const setup = () => {
				const { user, task, submissions, countedSubmissions } = createParams();

				submissionService.findAllByTask.mockResolvedValueOnce(countedSubmissions);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.hasPermission.mockReturnValueOnce(true).mockReturnValueOnce(false);

				return { taskId: task.id, user, submissions };
			};

			it('should return only submission1', async () => {
				const { user, taskId, submissions } = setup();

				const result = await submissionUc.findAllByTask(user.id, taskId);
				const expectedResult = [submissions[0]];

				expect(result).toEqual(expectedResult);
			});
		});

		describe('WHEN submission service throws error', () => {
			const setup = () => {
				const { user, task } = createParams();
				const error = new Error();

				submissionService.findAllByTask.mockRejectedValueOnce(error);

				return { taskId: task.id, user, error };
			};

			it('should pass error', async () => {
				const { user, taskId, error } = setup();

				await expect(submissionUc.findAllByTask(user.id, taskId)).rejects.toThrow(error);
			});
		});

		describe('WHEN getUserWithPermissions throws error', () => {
			const setup = () => {
				const { user, task, countedSubmissions } = createParams();
				const error = new Error();

				submissionService.findAllByTask.mockResolvedValueOnce(countedSubmissions);
				authorizationService.getUserWithPermissions.mockRejectedValueOnce(error);

				return { taskId: task.id, user, error };
			};

			it('should pass error', async () => {
				const { user, taskId, error } = setup();

				await expect(submissionUc.findAllByTask(user.id, taskId)).rejects.toThrow(error);
			});
		});
	});
});
