import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { BoardExternalReferenceType } from '@shared/domain';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	mapUserToCurrentUser,
	taskElementNodeFactory,
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server';
import { Request } from 'express';
import request from 'supertest';
import { SubmissionResponse } from '../dto/submission';

const baseRouteName = '/elements';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async post(taskId: string, requestBody?: object) {
		const response = await request(this.app.getHttpServer())
			.post(`${baseRouteName}/${taskId}/submissions`)
			.set('Accept', 'application/json')
			.send(requestBody);

		return {
			result: response.body as SubmissionResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe('submission create (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: API;

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
		em = module.get(EntityManager);
		api = new API(app);
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = async () => {
		await cleanupCollections(em);
		const user = userFactory.build();
		const course = courseFactory.build({ teachers: [user] });
		await em.persistAndFlush([user, course]);

		const columnBoardNode = columnBoardNodeFactory.buildWithId({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});

		const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });

		const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });

		const taskNode = taskElementNodeFactory.buildWithId({ parent: cardNode });

		await em.persistAndFlush([columnBoardNode, columnNode, cardNode, taskNode]);
		em.clear();

		return { user, columnBoardNode, columnNode, cardNode, taskNode };
	};

	describe('with valid user', () => {
		it('should return status 201', async () => {
			const { user, taskNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.post(taskNode.id, { completed: false });

			expect(response.status).toEqual(201);
		});

		it('should return created submission', async () => {
			const { user, taskNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.post(taskNode.id, { completed: false });

			expect(response.result.completed).toBe(false);
			expect(response.result.id).toBeDefined();
			expect(response.result.timestamps.createdAt).toBeDefined();
			expect(response.result.timestamps.lastUpdatedAt).toBeDefined();
			expect(response.result.userId).toBe(user.id);
		});

		// TODO: must fail if user wants to create more than one submission
	});

	// TODO: add test cases
	// student not part of the course should not be able to create submission
	// student part of the course should be able to create submission

	describe('with invalid user', () => {
		it('should return 403', async () => {
			const { taskNode } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);
			const response = await api.post(taskNode.id, { completed: false });

			expect(response.status).toEqual(403);
		});
	});
});
