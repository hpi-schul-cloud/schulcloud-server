import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { BoardExternalReferenceType } from '@shared/domain';
import {
	cleanupCollections,
	columnBoardNodeFactory,
	courseFactory,
	mapUserToCurrentUser,
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@modules/authentication';
import { JwtAuthGuard } from '@modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@modules/server/server.module';
import { Request } from 'express';
import request from 'supertest';
import { ColumnResponse } from '../dto';

const baseRouteName = '/boards';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async post(boardId: string) {
		const response = await request(this.app.getHttpServer())
			.post(`${baseRouteName}/${boardId}/columns`)
			.set('Accept', 'application/json');

		return {
			result: response.body as ColumnResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`board create (api)`, () => {
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

		await em.persistAndFlush([user, columnBoardNode]);
		em.clear();

		return { user, columnBoardNode };
	};

	describe('with valid user', () => {
		it('should return status 201', async () => {
			const { user, columnBoardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.post(columnBoardNode.id);

			expect(response.status).toEqual(201);
		});

		it('should return the created column', async () => {
			const { user, columnBoardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.post(columnBoardNode.id);

			expect(result.id).toBeDefined();
		});
	});

	describe('with valid user', () => {
		it('should return status 403', async () => {
			const { columnBoardNode } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);

			const response = await api.post(columnBoardNode.id);

			expect(response.status).toEqual(403);
		});
	});
});
