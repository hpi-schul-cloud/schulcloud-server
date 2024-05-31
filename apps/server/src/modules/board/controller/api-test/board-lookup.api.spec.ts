import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, courseFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { BoardExternalReferenceType, BoardLayout } from '../../domain';

import { cardEntityFactory, columnEntityFactory, columnBoardEntityFactory } from '../../testing';
import { BoardResponse } from '../dto';

const baseRouteName = '/boards';

describe(`board lookup (api)`, () => {
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

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	describe('When user is course teacher', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

			const course = courseFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherUser, course, teacherAccount]);

			const columnBoardNode = columnBoardEntityFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
			const cardNode1 = cardEntityFactory.withParent(columnNode).build();
			const cardNode2 = cardEntityFactory.withParent(columnNode).build();
			const cardNode3 = cardEntityFactory.withParent(columnNode).build();
			const notOfThisBoardCardNode = cardEntityFactory.buildWithId();

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode1, cardNode2, cardNode3, notOfThisBoardCardNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, columnBoardNode, columnNode, card1: cardNode1, card2: cardNode2, card3: cardNode3 };
		};

		describe('with valid board id', () => {
			it('should return status 200', async () => {
				const { loggedInClient, columnBoardNode } = await setup();

				const response = await loggedInClient.get(columnBoardNode.id);

				expect(response.status).toEqual(200);
			});

			it('should return the correct board', async () => {
				const { loggedInClient, columnBoardNode, columnNode } = await setup();

				const response = await loggedInClient.get(columnBoardNode.id);
				const result = response.body as BoardResponse;

				expect(result.id).toEqual(columnBoardNode.id);
				expect(result.columns).toHaveLength(1);
				expect(result.columns[0].id).toEqual(columnNode.id);
				expect(result.columns[0].cards).toHaveLength(3);
			});
		});

		describe('board layout', () => {
			it(`should default to ${BoardLayout.COLUMNS}`, async () => {
				const { loggedInClient, columnBoardNode } = await setup();

				const response = await loggedInClient.get(columnBoardNode.id);
				const result = response.body as BoardResponse;

				expect(result.layout).toEqual(BoardLayout.COLUMNS);
			});
		});

		describe('with invalid board id', () => {
			it('should return status 404', async () => {
				const { loggedInClient } = await setup();
				const notExistingBoardId = new ObjectId().toString();

				const response = await loggedInClient.get(notExistingBoardId);

				expect(response.status).toEqual(404);
			});
		});
	});

	describe('When user does not belong to course', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

			const course = courseFactory.build();
			await em.persistAndFlush([teacherUser, course, teacherAccount]);

			const columnBoardNode = columnBoardEntityFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			await em.persistAndFlush([columnBoardNode]);

			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, columnBoardNode };
		};

		it('should return status 403', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const response = await loggedInClient.get(columnBoardNode.id);

			expect(response.status).toEqual(403);
		});
	});
});
