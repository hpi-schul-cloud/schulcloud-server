import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { ICurrentUser, Permission } from '@shared/domain';
import {
	cleanupCollections,
	mapUserToCurrentUser,
	roleFactory,
	submissionFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { SubmissionStatusListResponse } from '@src/modules/task/controller/dto/submission.response';
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
}

describe('Submission Controller (e2e)', () => {
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

	describe('WHEN user is not authorized', () => {
		it('should return 401', async () => {
			const taskId = 'id';

			const { status } = await api.findStatusesByTask(taskId);

			expect(status).toEqual(401);
		});
	});

	describe('WHEN user is authorized, has permission', () => {
		const setup = async () => {
			const roles = roleFactory.buildList(1, {
				permissions: [Permission.SUBMISSIONS_VIEW],
			});
			const user = userFactory.buildWithId({ roles });
			const task = taskFactory.buildWithId();
			const submission = submissionFactory.buildWithId({ task, student: user, grade: 97 });

			await em.persistAndFlush([submission]);
			em.clear();
			currentUser = mapUserToCurrentUser(user);

			return { task, submission };
		};

		it('should return status', async () => {
			const { task, submission } = await setup();

			const { result: statuses } = await api.findStatusesByTask(task.id);

			const expectedSubmissionStatus = {
				data: [{ id: submission.id, creatorId: submission.student.id, grade: submission.grade }],
				total: 1,
			};

			expect(statuses).toEqual(expectedSubmissionStatus);
		});
	});

	describe('with bad request data', () => {
		it('should return status 400 for invalid taskId', async () => {
			const response = await api.findStatusesByTask('123');

			expect(response.status).toEqual(400);
			expect(response.error.validationErrors).toEqual([
				{
					errors: ['taskId must be a mongodb id'],
					field: 'taskId',
				},
			]);
		});
	});

	describe('WHEN user is authorized and has no permission', () => {
		const setup = async () => {
			const task = taskFactory.buildWithId();
			const user = userFactory.buildWithId();
			const submission = submissionFactory.buildWithId({ task });

			await em.persistAndFlush([submission]);
			em.clear();
			currentUser = mapUserToCurrentUser(user);

			return { task };
		};

		it('should return 403', async () => {
			const { task } = await setup();

			const { status } = await api.findStatusesByTask(task.id);

			expect(status).toEqual(403);
		});
	});
});
