import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Counted, Permission, PermissionContextBuilder, Submission } from '@shared/domain';
import { setupEntities, submissionFactory, taskFactory, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
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
				authorizationService.hasPermissionByReferences.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

				return { taskId: task.id, user, submissions };
			};

			it('should call findAllByTask', async () => {
				const { user, taskId } = setup();

				await submissionUc.findAllByTask(user.id, taskId);

				expect(submissionService.findAllByTask).toHaveBeenCalledWith(taskId);
			});

			it('should call hasPermissionByReferences', async () => {
				const { user, taskId, submissions } = setup();

				await submissionUc.findAllByTask(user.id, taskId);

				const permissionParams = (index: number) => {
					return [
						user.id,
						AllowedAuthorizationEntityType.Submission,
						submissions[index].id,
						PermissionContextBuilder.read([Permission.SUBMISSIONS_VIEW]),
					];
				};

				expect(authorizationService.hasPermissionByReferences).toHaveBeenNthCalledWith(1, ...permissionParams(0));
				expect(authorizationService.hasPermissionByReferences).toHaveBeenNthCalledWith(2, ...permissionParams(1));
			});

			it('should return submissions', async () => {
				const { user, taskId, submissions } = setup();

				const result = await submissionUc.findAllByTask(user.id, taskId);

				expect(result).toEqual([submissions, submissions.length]);
			});
		});

		describe('WHEN service returns successfully and user is authorized for second submission only', () => {
			const setup = () => {
				const { user, task, submissions, countedSubmissions } = createParams();

				submissionService.findAllByTask.mockResolvedValueOnce(countedSubmissions);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.hasPermissionByReferences.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

				return { taskId: task.id, user, submissions };
			};

			it('should return only submission2', async () => {
				const { user, taskId, submissions } = setup();

				const result = await submissionUc.findAllByTask(user.id, taskId);
				const expectedResult: Counted<Submission[]> = [[submissions[1]], 1];

				expect(result).toEqual(expectedResult);
			});
		});

		describe('WHEN service returns successfully and user is authorized for first submission only', () => {
			const setup = () => {
				const { user, task, submissions, countedSubmissions } = createParams();

				submissionService.findAllByTask.mockResolvedValueOnce(countedSubmissions);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.hasPermissionByReferences.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

				return { taskId: task.id, user, submissions };
			};

			it('should return only submission1', async () => {
				const { user, taskId, submissions } = setup();

				const result = await submissionUc.findAllByTask(user.id, taskId);
				const expectedResult: Counted<Submission[]> = [[submissions[0]], 1];

				expect(result).toEqual(expectedResult);
			});
		});

		describe('WHEN service throws error', () => {
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
	});
});
