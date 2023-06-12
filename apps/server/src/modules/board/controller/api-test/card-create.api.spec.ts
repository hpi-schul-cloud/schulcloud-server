import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { BoardExternalReferenceType } from '@shared/domain';
import {
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	mapUserToCurrentUser,
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { Request } from 'express';
import request from 'supertest';
import { CardResponse } from '../dto';

const baseRouteName = '/columns';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async post(columnId: string) {
		const response = await request(this.app.getHttpServer())
			.post(`${baseRouteName}/${columnId}/cards`)
			.set('Accept', 'application/json');

		return {
			result: response.body as CardResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`card create (api)`, () => {
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

		await em.persistAndFlush([columnBoardNode, columnNode]);
		em.clear();

		return { user, columnBoardNode, columnNode };
	};

	describe('with valid user', () => {
		it('should return status 201', async () => {
			const { user, columnNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.post(columnNode.id);

			expect(response.status).toEqual(201);
		});

		it('should return the created card', async () => {
			const { user, columnNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.post(columnNode.id);

			expect(result.id).toBeDefined();
		});
		// it('card should have empty elements of given types', async () => {
		// 	const { user, columnNode } = await setup();
		// 	currentUser = mapUserToCurrentUser(user);

		// 	const { result } = await api.post(columnNode.id);

		// 	expect(result.id).toBeDefined();
		// });
	});

	describe('with invalid user', () => {
		it('should return status 403', async () => {
			const { columnNode } = await setup();
			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);

			const response = await api.post(columnNode.id);

			expect(response.status).toEqual(403);
		});
	});
});
