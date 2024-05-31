import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, courseFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { BoardExternalReferenceType } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import {
	cardEntityFactory,
	columnBoardEntityFactory,
	columnEntityFactory,
	richTextElementEntityFactory,
} from '../../testing';

const baseRouteName = '/cards';

describe(`card delete (api)`, () => {
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

		const course = courseFactory.build({ teachers: [teacherUser] });
		await em.persistAndFlush([teacherUser, teacherAccount, course]);

		const columnBoardNode = columnBoardEntityFactory.build({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
		const cardNode = cardEntityFactory.withParent(columnNode).build({ position: 0 });
		const richTextElementNode = richTextElementEntityFactory.withParent(cardNode).build();
		const siblingCardNode = cardEntityFactory.withParent(columnNode).build({ position: 1 });

		await em.persistAndFlush([columnBoardNode, columnNode, cardNode, siblingCardNode, richTextElementNode]);
		em.clear();

		const loggedInClient = await testApiClient.login(teacherAccount);

		return { loggedInClient, cardNode, columnBoardNode, columnNode, siblingCardNode, richTextElementNode };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { loggedInClient, cardNode } = await setup();

			const response = await loggedInClient.delete(cardNode.id);

			expect(response.status).toEqual(204);
		});

		it('should actually delete card', async () => {
			const { loggedInClient, cardNode } = await setup();

			await loggedInClient.delete(cardNode.id);

			await expect(em.findOneOrFail(BoardNodeEntity, cardNode.id)).rejects.toThrow();
		});

		it('should actually delete elements of the card', async () => {
			const { loggedInClient, cardNode, richTextElementNode } = await setup();

			await loggedInClient.delete(cardNode.id);

			await expect(em.findOneOrFail(BoardNodeEntity, richTextElementNode.id)).rejects.toThrow();
		});

		it('should not delete siblings', async () => {
			const { loggedInClient, cardNode, siblingCardNode } = await setup();

			await loggedInClient.delete(cardNode.id);

			const siblingFromDb = await em.findOneOrFail(BoardNodeEntity, siblingCardNode.id);
			expect(siblingFromDb).toBeDefined();
		});

		it('should update position of the siblings', async () => {
			const { loggedInClient, cardNode, siblingCardNode } = await setup();

			await loggedInClient.delete(cardNode.id);

			const siblingFromDb = await em.findOneOrFail(BoardNodeEntity, siblingCardNode.id);
			expect(siblingFromDb.position).toEqual(0);
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
			const { loggedInClient, cardNode } = await setupNoAccess();

			const response = await loggedInClient.delete(cardNode.id);

			expect(response.status).toEqual(403);
		});
	});
});
