import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory, courseGroupEntityFactory } from '@modules/course/testing';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { ServerTestModule } from '@modules/server/server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common/error';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { Submission } from '../../repo';
import { submissionFactory, taskFactory } from '../../testing';
import { SubmissionStatusListResponse } from '../dto';

describe('Submission Controller (API)', () => {
	describe('find statuses by task', () => {
		let app: INestApplication;
		let em: EntityManager;
		let apiClient: TestApiClient;

		beforeAll(async () => {
			const module: TestingModule = await Test.createTestingModule({
				imports: [ServerTestModule],
			}).compile();

			app = module.createNestApplication();
			await app.init();
			em = module.get(EntityManager);
			apiClient = new TestApiClient(app, '/submissions');
		});

		beforeEach(async () => {
			await cleanupCollections(em);
		});

		afterAll(async () => {
			await app.close();
		});

		describe('WHEN user is not authenticated', () => {
			it('should return 401', async () => {
				const taskId = 'id';

				const { status } = await apiClient.get(`status/task/${taskId}`);

				expect(status).toEqual(401);
			});
		});

		describe('WHEN user is authenticated and has permission', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const task = taskFactory.buildWithId();
				const courseGroup = courseGroupEntityFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task, student: teacherUser, grade: 97, courseGroup });

				await em.persist([submission, teacherAccount, teacherUser]).flush();
				em.clear();

				const loggedInClient = await apiClient.login(teacherAccount);

				return { loggedInClient, task, submission };
			};

			it('should return status', async () => {
				const { task, submission, loggedInClient } = await setup();

				const response = await loggedInClient.get(`status/task/${task.id}`);
				const statuses = response.body as SubmissionStatusListResponse;

				const expectedSubmissionStatuses = {
					data: [
						{
							id: submission.id,
							submitters: submission.getSubmitterIds(),
							isSubmitted: submission.isSubmitted(),
							isGraded: submission.isGraded(),
							grade: submission.grade,
							submittingCourseGroupName: submission.courseGroup?.name,
						},
					],
				};

				expect(statuses).toEqual(expectedSubmissionStatuses);
			});
		});

		describe('with bad request data', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const task = taskFactory.buildWithId();
				const courseGroup = courseGroupEntityFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task, student: teacherUser, grade: 97, courseGroup });

				await em.persist([submission, teacherAccount, teacherUser]).flush();
				em.clear();

				const loggedInClient = await apiClient.login(teacherAccount);

				return { loggedInClient, task, submission };
			};

			it('should return status 400 for invalid taskId', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get(`status/task/123`);
				const result = response.body as ApiValidationError;

				expect(response.status).toEqual(400);
				expect(result.validationErrors).toEqual([
					{
						errors: ['taskId must be a mongodb id'],
						field: ['taskId'],
					},
				]);
			});
		});

		describe('WHEN user is authenticated and has no permission', () => {
			const setup = async () => {
				const task = taskFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const submission = submissionFactory.buildWithId({ task });

				await em.persist([submission, teacherUser, teacherAccount]).flush();
				em.clear();

				const loggedInClient = await apiClient.login(teacherAccount);

				return { task, loggedInClient };
			};

			it('should return 200', async () => {
				const { task, loggedInClient } = await setup();

				const response = await loggedInClient.get(`status/task/${task.id}`);

				const expectedResult = { data: [] };

				expect(response.status).toEqual(200);
				expect(response.body).toEqual(expectedResult);
			});
		});
	});

	describe('delete submission', () => {
		let app: INestApplication;
		let em: EntityManager;
		let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;
		let apiClient: TestApiClient;

		beforeAll(async () => {
			const module: TestingModule = await Test.createTestingModule({
				imports: [ServerTestModule],
			})
				.overrideProvider(FilesStorageClientAdapterService)
				.useValue(createMock<FilesStorageClientAdapterService>())
				.compile();

			app = module.createNestApplication();
			await app.init();
			em = module.get(EntityManager);
			filesStorageClientAdapterService = app.get(FilesStorageClientAdapterService);
			apiClient = new TestApiClient(app, '/submissions');
		});

		beforeEach(async () => {
			await cleanupCollections(em);
		});

		afterAll(async () => {
			await app.close();
		});

		describe('WHEN user is not authenticated', () => {
			it('should return 401', async () => {
				const submissionId = 'id';

				const { status } = await apiClient.delete(submissionId);

				expect(status).toEqual(401);
			});
		});

		describe('WHEN user is authenticated and has permission', () => {
			const setup = async () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task, student: studentUser, grade: 97 });

				await em.persist([submission, studentUser, studentAccount]).flush();
				em.clear();

				const loggedInClient = await apiClient.login(studentAccount);

				return { submission, loggedInClient };
			};

			it('should return status', async () => {
				const { submission, loggedInClient } = await setup();

				const result = await loggedInClient.delete(submission.id);

				expect(filesStorageClientAdapterService.deleteFilesOfParent).toBeCalled();
				expect(result.text).toBe('true');

				const expectedSubmissionResult = await em.findOne(Submission, { id: submission.id });
				expect(expectedSubmissionResult).toEqual(null);
			});
		});

		describe('with bad request data', () => {
			const setup = async () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task, student: studentUser, grade: 97 });

				await em.persist([submission, studentUser, studentAccount]).flush();
				em.clear();

				const loggedInClient = await apiClient.login(studentAccount);

				return { submission, loggedInClient };
			};

			it('should return status 400 for invalid taskId', async () => {
				const { loggedInClient } = await setup();
				const response = await loggedInClient.delete('123');
				const result = response.body as ApiValidationError;

				expect(response.status).toEqual(400);
				expect(result.validationErrors).toEqual([
					{
						errors: ['submissionId must be a mongodb id'],
						field: ['submissionId'],
					},
				]);
			});
		});

		describe('WHEN user is authenticated and has no permission', () => {
			const setup = async () => {
				const course = courseEntityFactory.buildWithId();
				const task = taskFactory.buildWithId({ course });
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();
				const submission = submissionFactory.buildWithId({ task });

				await em.persist([submission, studentUser, studentAccount]).flush();
				em.clear();

				const loggedInClient = await apiClient.login(studentAccount);

				return { submission, loggedInClient };
			};

			it('should return 403', async () => {
				const { submission, loggedInClient } = await setup();

				const { status } = await loggedInClient.delete(submission.id);

				expect(status).toEqual(403);
			});
		});

		describe('WHEN user is authenticated, has no permission and task has no parent', () => {
			const setup = async () => {
				const task = taskFactory.buildWithId();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();
				const submission = submissionFactory.buildWithId({ task });

				await em.persist([submission, studentUser, studentAccount]).flush();
				em.clear();

				const loggedInClient = await apiClient.login(studentAccount);

				return { submission, loggedInClient };
			};

			it('should return 403', async () => {
				const { submission, loggedInClient } = await setup();

				const { status } = await loggedInClient.delete(submission.id);

				expect(status).toEqual(403);
			});
		});
	});
});
