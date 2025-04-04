import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { Counted } from '@shared/domain/types';
import { setupEntities } from '@testing/database';
import { SubmissionService } from '../domain';
import { Submission, Task } from '../repo';
import { submissionFactory, taskFactory } from '../testing';
import { SubmissionUc } from './submission.uc';

describe('Submission Uc', () => {
	let module: TestingModule;
	let submissionUc: SubmissionUc;
	let submissionService: DeepMocked<SubmissionService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		await setupEntities([User, Task, Submission, CourseEntity, CourseGroupEntity, LessonEntity, Material]);

		module = await Test.createTestingModule({
			imports: [],
			providers: [
				SubmissionUc,
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

		submissionUc = module.get(SubmissionUc);
		submissionService = module.get(SubmissionService);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
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
				const permissionContext = AuthorizationContextBuilder.read([Permission.SUBMISSIONS_VIEW]);

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
				const expectedResult = [submissions[1]];

				const result = await submissionUc.findAllByTask(user.id, taskId);

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

	describe('delete is called', () => {
		describe('WHEN user has permission and service deletes succesfully', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();
				const user = userFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				submissionService.findById.mockResolvedValueOnce(submission);
				authorizationService.checkPermission.mockImplementation();
				submissionService.delete.mockResolvedValueOnce();

				return { submission, user };
			};

			it('should return true', async () => {
				const { submission, user } = setup();

				const result = await submissionUc.delete(user.id, submission.id);

				expect(submissionService.findById).toHaveBeenCalledWith(submission.id);
				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					submission,
					AuthorizationContextBuilder.write([Permission.SUBMISSIONS_EDIT])
				);
				expect(submissionService.delete).toHaveBeenCalledWith(submission);
				expect(result).toBe(true);
			});
		});

		describe('WHEN user can not be found', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();
				const user = userFactory.buildWithId();
				const error = new Error();

				authorizationService.getUserWithPermissions.mockRejectedValueOnce(error);

				return { submission, user, error };
			};

			it('should pass error', async () => {
				const { submission, user, error } = setup();

				await expect(submissionUc.delete(user.id, submission.id)).rejects.toThrow(error);
			});
		});

		describe('WHEN submission can not be found', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();
				const user = userFactory.buildWithId();
				const error = new Error();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				submissionService.findById.mockRejectedValueOnce(error);

				return { submission, user, error };
			};

			it('should pass error', async () => {
				const { submission, user, error } = setup();

				await expect(submissionUc.delete(user.id, submission.id)).rejects.toThrow(error);
			});
		});

		describe('WHEN user has no permission', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();
				const user = userFactory.buildWithId();
				const error = new Error();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				submissionService.findById.mockResolvedValueOnce(submission);
				authorizationService.checkPermission.mockImplementation(() => {
					throw error;
				});

				return { submission, user, error };
			};

			it('should pass error', async () => {
				const { submission, user, error } = setup();

				await expect(submissionUc.delete(user.id, submission.id)).rejects.toThrow(error);
			});
		});

		describe('WHEN service returns error', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();
				const user = userFactory.buildWithId();
				const error = new Error();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				submissionService.findById.mockResolvedValueOnce(submission);
				authorizationService.checkPermission.mockImplementation();
				submissionService.delete.mockRejectedValueOnce(error);

				return { submission, user, error };
			};

			it('should pass error', async () => {
				const { submission, user, error } = setup();

				await expect(submissionUc.delete(user.id, submission.id)).rejects.toThrow(error);
			});
		});
	});
});
