import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
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
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { Request } from 'express';
import request from 'supertest';
import { BoardResponse } from '../dto';

const baseRouteName = '/boards';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async get(id: string) {
		const response = await request(this.app.getHttpServer())
			.get(`${baseRouteName}/${id}`)
			.set('Accept', 'application/json');

		return {
			result: response.body as BoardResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`board lookup (api)`, () => {
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
		const cardNode1 = cardNodeFactory.buildWithId({ parent: columnNode });
		const cardNode2 = cardNodeFactory.buildWithId({ parent: columnNode });
		const cardNode3 = cardNodeFactory.buildWithId({ parent: columnNode });
		const notOfThisBoardCardNode = cardNodeFactory.buildWithId();

		await em.persistAndFlush([columnBoardNode, columnNode, cardNode1, cardNode2, cardNode3, notOfThisBoardCardNode]);
		em.clear();

		currentUser = mapUserToCurrentUser(user);

		return { columnBoardNode, columnNode, card1: cardNode1, card2: cardNode2, card3: cardNode3 };
	};

	describe('with valid board ids', () => {
		it('should return status 200', async () => {
			const { columnBoardNode } = await setup();

			const response = await api.get(`${columnBoardNode.id}`);

			expect(response.status).toEqual(200);
		});

		it('should return the right board', async () => {
			const { columnBoardNode, columnNode } = await setup();

			const { result } = await api.get(columnBoardNode.id);

			expect(result.id).toEqual(columnBoardNode.id);
			expect(result.columns).toHaveLength(1);
			expect(result.columns[0].id).toEqual(columnNode.id);
			expect(result.columns[0].cards).toHaveLength(3);
		});
	});

	describe('with invalid board id', () => {
		it('should return status 404', async () => {
			await setup();
			const notExistingBoardId = new ObjectId().toString();

			const response = await api.get(notExistingBoardId);

			expect(response.status).toEqual(404);
		});
	});

	describe('with invalid user', () => {
		it('should return status 200', async () => {
			const { columnBoardNode } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);

			const response = await api.get(`${columnBoardNode.id}`);

			expect(response.status).toEqual(403);
		});
	});
});
