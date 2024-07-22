import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, courseFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { BoardExternalReferenceType } from '../../domain';
import {
	cardEntityFactory,
	columnBoardEntityFactory,
	columnEntityFactory,
	richTextElementEntityFactory,
} from '../../testing';
import { CardListResponse } from '../dto';

const baseRouteName = '/cards';

describe(`card lookup (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = async () => {
		const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
		const course = courseFactory.buildWithId({ teachers: [teacherUser] });
		await em.persistAndFlush([teacherUser, teacherAccount, course]);

		const columnBoardNode = columnBoardEntityFactory.build({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
		const cardNode1 = cardEntityFactory.withParent(columnNode).build();
		const cardNode2 = cardEntityFactory.withParent(columnNode).build();
		const cardNode3 = cardEntityFactory.withParent(columnNode).build();
		const richTextElement = richTextElementEntityFactory.withParent(cardNode1).build();

		await em.persistAndFlush([columnBoardNode, columnNode, cardNode1, cardNode2, cardNode3, richTextElement]);
		em.clear();

		const loggedInClient = await testApiClient.login(teacherAccount);

		return {
			loggedInClient,
			columnBoardNode,
			columnNode,
			card1: cardNode1,
			card2: cardNode2,
			card3: cardNode3,
			course,
		};
	};

	describe('with valid card ids', () => {
		it('should return status 200', async () => {
			const { loggedInClient, card1 } = await setup();

			const response = await loggedInClient.get().query({ ids: [card1.id] });

			expect(response.status).toEqual(200);
		});

		it('should return one card for a single id', async () => {
			const { loggedInClient, card1 } = await setup();

			const response = await loggedInClient.get().query({ ids: [card1.id] });

			const result = response.body as CardListResponse;

			expect(result.data).toHaveLength(1);
			expect(result.data[0].id).toBe(card1.id);
		});

		it('should return multiple cards for multiple ids', async () => {
			const { loggedInClient, card1, card2 } = await setup();

			const response = await loggedInClient.get().query({ ids: [card1.id, card2.id] });

			const result = response.body as CardListResponse;

			expect(result.data).toHaveLength(2);
			const returnedIds = result.data.map((c) => c.id);
			expect(returnedIds).toContain(card1.id);
			expect(returnedIds).toContain(card2.id);
		});
	});

	describe('with invalid card ids', () => {
		it('should return empty array if card id does not exist', async () => {
			const { loggedInClient } = await setup();

			const notExistingCardId = new ObjectId().toHexString();

			const response = await loggedInClient.get().query({ ids: [notExistingCardId] });
			const result = response.body as CardListResponse;

			expect(response.status).toEqual(200);
			expect(result.data).toHaveLength(0);
		});

		it('should return only results of existing cards', async () => {
			const { loggedInClient, card1, card2 } = await setup();

			const notExistingCardId = new ObjectId().toHexString();

			const response = await loggedInClient.get().query({ ids: [card1.id, notExistingCardId, card2.id] });
			const result = response.body as CardListResponse;

			expect(result.data).toHaveLength(2);
			const returnedIds = result.data.map((c) => c.id);
			expect(returnedIds).toContain(card1.id);
			expect(returnedIds).toContain(card2.id);
		});
	});

	describe('with invalid user', () => {
		const setupNoAccess = async () => {
			const vars = await setup();

			const { studentAccount: noAccessAccount, studentUser: noAccessUser } = UserAndAccountTestFactory.buildStudent();
			await em.persistAndFlush([noAccessAccount, noAccessUser]);
			const loggedInClient = await testApiClient.login(noAccessAccount);

			return {
				...vars,
				loggedInClient,
			};
		};

		it('should return status 200', async () => {
			const { loggedInClient, card1 } = await setupNoAccess();

			const response = await loggedInClient.get().query({ ids: [card1.id] });
			const result = response.body as CardListResponse;

			expect(response.status).toEqual(200);
			expect(result).toEqual({ data: [] });
		});
	});
});
