import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import { cardEntityFactory, columnBoardEntityFactory, columnEntityFactory } from '../../testing';
import { CardResponse } from '../dto';

const baseRouteName = '/cards';

describe(`card move (api)`, () => {
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

		const course = courseEntityFactory.build({ school: teacherUser.school, teachers: [teacherUser] });
		await em.persistAndFlush([teacherUser, teacherAccount, course]);

		const columnBoardNode = columnBoardEntityFactory.build({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const parentColumn = columnEntityFactory.withParent(columnBoardNode).build();
		const cardNode1 = cardEntityFactory.withParent(parentColumn).build();
		const cardNode2 = cardEntityFactory.withParent(parentColumn).build();

		await em.persistAndFlush([cardNode1, cardNode2, parentColumn, columnBoardNode]);
		em.clear();

		const loggedInClient = await testApiClient.login(teacherAccount);

		return { loggedInClient, cardNode1, cardNode2, parentColumn, columnBoardNode };
	};

	describe('with valid user', () => {
		it('should return status 201', async () => {
			const { loggedInClient, cardNode1 } = await setup();

			const response = await loggedInClient.post(`${cardNode1.id}/copy`);

			expect(response.status).toEqual(201);
		});

		it('should return copy api response with new card id', async () => {
			const { loggedInClient, cardNode1 } = await setup();

			const response = await loggedInClient.post(`${cardNode1.id}/copy`);
			const copiedCard = response.body as CardResponse;

			expect(copiedCard.id).toBeDefined();
			expect(copiedCard.title).toEqual(cardNode1.title);
		});

		it('should actually copy the card in the same column', async () => {
			const { loggedInClient, cardNode1 } = await setup();

			const response = await loggedInClient.post(`${cardNode1.id}/copy`);
			const copiedCard = response.body as CardResponse;
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion

			const result = await em.findOneOrFail(BoardNodeEntity, copiedCard.id);

			expect(result.path).toEqual(cardNode1.path);
		});

		it('should place the card under the original', async () => {
			const { loggedInClient, cardNode1, cardNode2 } = await setup();

			const response = await loggedInClient.post(`${cardNode1.id}/copy`);
			const copiedCard = response.body as CardResponse;
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion

			const resultCopiedCard = await em.findOneOrFail(BoardNodeEntity, copiedCard.id);
			const resultCard1 = await em.findOneOrFail(BoardNodeEntity, cardNode1.id);
			const resultCard2 = await em.findOneOrFail(BoardNodeEntity, cardNode2.id);

			expect(resultCard1.position).toEqual(cardNode1.position);
			expect(resultCopiedCard.position).toEqual(cardNode1.position + 1);
			expect(resultCard2.position).not.toEqual(cardNode2.position);
			expect(resultCard2.position).toEqual(resultCopiedCard.position + 1);
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

		it('should return status 403', async () => {
			const { loggedInClient, cardNode1 } = await setupNoAccess();

			const response = await loggedInClient.post(`${cardNode1.id}/copy`);

			expect(response.status).toEqual(403);
		});
	});
});
