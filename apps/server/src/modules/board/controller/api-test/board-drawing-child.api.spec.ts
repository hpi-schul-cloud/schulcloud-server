import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { drawingElementNodeFactory } from '@shared/testing/factory/boardnode/drawing-element-node.factory';

const baseRouteName = '/boards';

describe(`has drawing child (api)`, () => {
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

	describe('with valid board ids', () => {
		describe('when drawing is ancestor of a board', () => {
			const setup = async () => {
				await cleanupCollections(em);
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const course = courseFactory.build({ teachers: [teacherUser] });
				const course2 = courseFactory.build({ teachers: [teacherUser] });
				await em.persistAndFlush([teacherAccount, teacherUser, course, course2]);

				const columnBoardNode = columnBoardNodeFactory.buildWithId({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});
				const columnBoardNoChildrenNode = columnBoardNodeFactory.buildWithId({
					context: { id: course2.id, type: BoardExternalReferenceType.Course },
				});
				const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
				const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });
				const drawingNode = drawingElementNodeFactory.buildWithId({ parent: cardNode });

				await em.persistAndFlush([columnBoardNode, columnNode, cardNode, drawingNode, columnBoardNoChildrenNode]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { columnBoardNode, columnBoardNoChildrenNode, loggedInClient };
			};

			it('should return status 200', async () => {
				const { columnBoardNode, loggedInClient } = await setup();

				const response = await loggedInClient.get(`${columnBoardNode.id}`);

				expect(response.status).toEqual(200);
			});
			it('should return true as response', async () => {
				const { columnBoardNode, loggedInClient } = await setup();

				const result = await loggedInClient.get(`${columnBoardNode.id}/hasDrawingChild`);

				expect(result.text).toEqual('true');
			});
		});
		describe('when drawing is ancestor of a board', () => {
			const setup = async () => {
				await cleanupCollections(em);
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const course = courseFactory.build({ teachers: [teacherUser] });
				await em.persistAndFlush([teacherAccount, teacherUser, course]);

				const columnBoardNoChildrenNode = columnBoardNodeFactory.buildWithId({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});

				await em.persistAndFlush([columnBoardNoChildrenNode]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { columnBoardNoChildrenNode, loggedInClient };
			};

			it('should return false as response', async () => {
				const { columnBoardNoChildrenNode, loggedInClient } = await setup();

				const result = await loggedInClient.get(`${columnBoardNoChildrenNode.id}/hasDrawingChild`);

				expect(result.text).toEqual('false');
			});
		});
	});

	describe('with invalid board id', () => {
		const setup = async () => {
			await cleanupCollections(em);
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			await em.persistAndFlush([teacherAccount, teacherUser]);

			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient };
		};

		it('should return status 404', async () => {
			const { loggedInClient } = await setup();
			const notExistingBoardId = new ObjectId().toString();

			const response = await loggedInClient.get(notExistingBoardId);

			expect(response.status).toEqual(404);
		});
	});

	describe('with invalid user (no permission)', () => {
		const setup = async () => {
			await cleanupCollections(em);
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

			const course = courseFactory.build();
			await em.persistAndFlush([teacherAccount, teacherUser, course]);

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			await em.persistAndFlush([columnBoardNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { columnBoardNode, loggedInClient };
		};

		it('should return status 403', async () => {
			const { columnBoardNode, loggedInClient } = await setup();

			const response = await loggedInClient.get(`${columnBoardNode.id}/hasDrawingChild`);

			expect(response.status).toEqual(403);
		});
	});
});
