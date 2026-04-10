import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType, BoardLayout } from '../../domain';
import { cardEntityFactory, columnBoardEntityFactory, columnEntityFactory } from '../../testing';
import { BoardResponse } from '../dto';

const baseRouteName = '/boards';

describe(`board lookup in course (api)`, () => {
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

			const course = courseEntityFactory.build({ school: teacherUser.school, teachers: [teacherUser] });
			await em.persist([teacherUser, course, teacherAccount]).flush();

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
			const cardNode1 = cardEntityFactory.withParent(columnNode).build();
			const cardNode2 = cardEntityFactory.withParent(columnNode).build();
			const cardNode3 = cardEntityFactory.withParent(columnNode).build();
			const notOfThisBoardCardNode = cardEntityFactory.build();

			await em.persist([columnBoardNode, columnNode, cardNode1, cardNode2, cardNode3, notOfThisBoardCardNode]).flush();
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

			it('should include allowed operations', async () => {
				const { loggedInClient, columnBoardNode } = await setup();

				const response = await loggedInClient.get(columnBoardNode.id);
				const result = response.body as BoardResponse;

				expect(result.allowedOperations).toEqual(
					expect.objectContaining({
						createCard: true,
						createColumn: true,
						deleteCard: true,
						moveCard: true,
						moveColumn: true,
						updateCardTitle: true,
					})
				);
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

			const course = courseEntityFactory.build();
			await em.persist([teacherUser, course, teacherAccount]).flush();

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			await em.persist([columnBoardNode]).flush();

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
