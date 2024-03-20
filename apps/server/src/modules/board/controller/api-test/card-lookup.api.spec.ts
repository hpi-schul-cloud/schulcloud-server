import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { JwtAuthGuard } from '@modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@modules/server/server.module';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	mapUserToCurrentUser,
	richTextElementNodeFactory,
	roleFactory,
	schoolEntityFactory,
	userFactory,
} from '@shared/testing';
import { Request } from 'express';
import request from 'supertest';
import { CardIdsParams, CardListResponse } from '../dto';

const baseRouteName = '/cards';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async get(query: CardIdsParams) {
		const response = await request(this.app.getHttpServer())
			.get(baseRouteName)
			.set('Accept', 'application/json')
			.query(query || {});

		return {
			result: response.body as CardListResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`card lookup (api)`, () => {
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
		const school = schoolEntityFactory.build();
		const roles = roleFactory.buildList(1, {
			// permissions: [Permission.COURSE_CREATE],
		});
		const user = userFactory.build({ school, roles });
		const course = courseFactory.buildWithId({ teachers: [user] });
		await em.persistAndFlush([user, course]);

		const columnBoardNode = columnBoardNodeFactory.buildWithId({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
		const cardNode1 = cardNodeFactory.buildWithId({ parent: columnNode });
		const cardNode2 = cardNodeFactory.buildWithId({ parent: columnNode });
		const cardNode3 = cardNodeFactory.buildWithId({ parent: columnNode });
		const richTextElement = richTextElementNodeFactory.buildWithId({ parent: cardNode1 });

		await em.persistAndFlush([columnBoardNode, columnNode, cardNode1, cardNode2, cardNode3, richTextElement]);
		await em.persistAndFlush([columnBoardNode, columnNode, cardNode1, cardNode2, cardNode3]);
		em.clear();

		currentUser = mapUserToCurrentUser(user);

		return { columnBoardNode, columnNode, card1: cardNode1, card2: cardNode2, card3: cardNode3, user, course };
	};

	describe('with valid card ids', () => {
		it('should return status 200', async () => {
			const { user, card1 } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.get({ ids: [card1.id] });

			expect(response.status).toEqual(200);
		});

		it('should return one card for a single id', async () => {
			const { user, card1 } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.get({ ids: [card1.id] });

			expect(result.data).toHaveLength(1);
			expect(result.data[0].id).toBe(card1.id);
		});

		it('should return multiple cards for multiple ids', async () => {
			const { user, card1, card2 } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.get({ ids: [card1.id, card2.id] });

			expect(result.data).toHaveLength(2);
			const returnedIds = result.data.map((c) => c.id);
			expect(returnedIds).toContain(card1.id);
			expect(returnedIds).toContain(card2.id);
		});
	});

	describe('with invalid card ids', () => {
		it('should return empty array if card id does not exist', async () => {
			const { user } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const notExistingCardId = new ObjectId().toHexString();

			const { result, status } = await api.get({ ids: [notExistingCardId] });

			expect(status).toEqual(200);
			expect(result.data).toHaveLength(0);
		});

		it('should return only results of existing cards', async () => {
			const { user, card1, card2 } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const notExistingCardId = new ObjectId().toHexString();

			const { result } = await api.get({ ids: [card1.id, notExistingCardId, card2.id] });

			expect(result.data).toHaveLength(2);
			const returnedIds = result.data.map((c) => c.id);
			expect(returnedIds).toContain(card1.id);
			expect(returnedIds).toContain(card2.id);
		});
	});

	describe('with invalid user', () => {
		it('should return status 200', async () => {
			const { card1 } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);

			const response = await api.get({ ids: [card1.id] });

			expect(response.status).toEqual(200);
			expect(response.result).toEqual({ data: [] });
		});
	});
});
