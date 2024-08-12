import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser, JwtAuthGuard } from '@infra/auth-guard';
import { EntityManager } from '@mikro-orm/mongodb';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { ServerTestModule } from '@modules/server/server.module';
import { SubmissionStatusListResponse } from '@modules/task/controller/dto/submission.response';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { Submission } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import {
	cleanupCollections,
	courseGroupFactory,
	mapUserToCurrentUser,
	roleFactory,
	submissionFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { Request } from 'express';
import request from 'supertest';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async findStatusesByTask(taskId: string) {
		const response = await request(this.app.getHttpServer())
			.get(`/submissions/status/task/${taskId}`)
			.set('Accept', 'application/json')
			.set('Authorization', 'jwt');

		return {
			status: response.status,
			error: response.body as ApiValidationError,
			result: response.body as SubmissionStatusListResponse,
		};
	}

	async delete(submissionId: string) {
		const response = await request(this.app.getHttpServer())
			.delete(`/submissions/${submissionId}`)
			.set('Accept', 'application/json')
			.set('Authorization', 'jwt');

		return {
			status: response.status,
			error: response.body as ApiValidationError,
			result: response.text,
		};
	}
}

describe('Submission Controller (API)', () => {
	describe('find statuses by task', () => {
		let app: INestApplication;
		let currentUser: ICurrentUser;
		let api: API;
		let em: EntityManager;

		beforeAll(async () => {
			const module: TestingModule = await Test.createTestingModule({
				imports: [ServerTestModule],
			})
				.overrideGuard(JwtAuthGuard)
				.useValue({
					canActivate(context: ExecutionContext) {
						const req: Request = context.switchToHttp().getRequest();
						req.user = currentUser;

						return true;
					},
				})
				.compile();

			app = module.createNestApplication();
			await app.init();
			api = new API(app);
			em = module.get(EntityManager);
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

				const { status } = await api.findStatusesByTask(taskId);

				expect(status).toEqual(401);
			});
		});

		describe('WHEN user is authenticated and has permission', () => {
			const setup = async () => {
				const roles = roleFactory.buildList(1, {
					permissions: [Permission.SUBMISSIONS_VIEW],
				});
				const user = userFactory.buildWithId({ roles });
				const task = taskFactory.buildWithId();
				const courseGroup = courseGroupFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task, student: user, grade: 97, courseGroup });

				await em.persistAndFlush([submission]);
				em.clear();
				currentUser = mapUserToCurrentUser(user);

				return { task, submission };
			};

			it('should return status', async () => {
				const { task, submission } = await setup();

				const { result: statuses } = await api.findStatusesByTask(task.id);

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
			it('should return status 400 for invalid taskId', async () => {
				const response = await api.findStatusesByTask('123');

				expect(response.status).toEqual(400);
				expect(response.error.validationErrors).toEqual([
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
				const user = userFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task });

				await em.persistAndFlush([submission, user]);
				em.clear();
				currentUser = mapUserToCurrentUser(user);

				return { task };
			};

			it('should return 200 and empty array', async () => {
				const { task } = await setup();

				const { status, result } = await api.findStatusesByTask(task.id);

				const expectedResult = { data: [] };

				expect(status).toEqual(200);
				expect(result).toEqual(expectedResult);
			});
		});
	});

	describe('delete submission', () => {
		let app: INestApplication;
		let currentUser: ICurrentUser;
		let api: API;
		let em: EntityManager;
		let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;

		beforeAll(async () => {
			const module: TestingModule = await Test.createTestingModule({
				imports: [ServerTestModule],
			})
				.overrideGuard(JwtAuthGuard)
				.useValue({
					canActivate(context: ExecutionContext) {
						const req: Request = context.switchToHttp().getRequest();
						req.user = currentUser;

						return true;
					},
				})
				.overrideProvider(FilesStorageClientAdapterService)
				.useValue(createMock<FilesStorageClientAdapterService>())
				.compile();

			app = module.createNestApplication();
			await app.init();
			api = new API(app);
			em = module.get(EntityManager);
			filesStorageClientAdapterService = app.get(FilesStorageClientAdapterService);
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

				const { status } = await api.delete(submissionId);

				expect(status).toEqual(401);
			});
		});

		describe('WHEN user is authenticated and has permission', () => {
			const setup = async () => {
				const roles = roleFactory.buildList(1, {
					permissions: [Permission.SUBMISSIONS_EDIT],
				});
				const user = userFactory.buildWithId({ roles });
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task, student: user, grade: 97 });

				await em.persistAndFlush([submission]);
				em.clear();
				currentUser = mapUserToCurrentUser(user);

				return { submission };
			};

			it('should return status', async () => {
				const { submission } = await setup();

				const { result } = await api.delete(submission.id);

				expect(filesStorageClientAdapterService.deleteFilesOfParent).toBeCalled();
				expect(result).toBe('true');

				const expectedSubmissionResult = await em.findOne(Submission, { id: submission.id });
				expect(expectedSubmissionResult).toEqual(null);
			});
		});

		describe('with bad request data', () => {
			it('should return status 400 for invalid taskId', async () => {
				const response = await api.delete('123');

				expect(response.status).toEqual(400);
				expect(response.error.validationErrors).toEqual([
					{
						errors: ['submissionId must be a mongodb id'],
						field: ['submissionId'],
					},
				]);
			});
		});

		describe('WHEN user is authenticated and has no permission', () => {
			const setup = async () => {
				const task = taskFactory.buildWithId();
				const user = userFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task });

				await em.persistAndFlush([submission, user]);
				em.clear();
				currentUser = mapUserToCurrentUser(user);

				return { submission };
			};

			it('should return 403', async () => {
				const { submission } = await setup();

				const { status } = await api.delete(submission.id);

				expect(status).toEqual(403);
			});
		});
	});
});
