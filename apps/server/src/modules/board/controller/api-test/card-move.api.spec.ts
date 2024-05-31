import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, courseFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { BoardExternalReferenceType, pathOfChildren } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import { cardEntityFactory, columnBoardEntityFactory, columnEntityFactory } from '../../testing';
import { MoveCardBodyParams } from '../dto';

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

		const course = courseFactory.build({ teachers: [teacherUser] });
		await em.persistAndFlush([teacherUser, teacherAccount, course]);

		const columnBoardNode = columnBoardEntityFactory.build({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const parentColumn = columnEntityFactory.withParent(columnBoardNode).build();
		const cardNode1 = cardEntityFactory.withParent(parentColumn).build();
		const cardNode2 = cardEntityFactory.withParent(parentColumn).build();
		const targetColumn = columnEntityFactory.withParent(columnBoardNode).build();
		const targetColumnCards = cardEntityFactory.withParent(targetColumn).buildList(4);

		await em.persistAndFlush([cardNode1, cardNode2, parentColumn, targetColumn, columnBoardNode, ...targetColumnCards]);
		em.clear();

		const loggedInClient = await testApiClient.login(teacherAccount);

		return { loggedInClient, cardNode1, cardNode2, parentColumn, targetColumn, columnBoardNode, targetColumnCards };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { loggedInClient, cardNode1, targetColumn } = await setup();

			const params: MoveCardBodyParams = {
				toColumnId: targetColumn.id,
				toPosition: 3,
			};

			const response = await loggedInClient.put(`${cardNode1.id}/position`, params);

			expect(response.status).toEqual(204);
		});

		it('should actually move the card', async () => {
			const { loggedInClient, cardNode1, targetColumn } = await setup();

			const params: MoveCardBodyParams = {
				toColumnId: targetColumn.id,
				toPosition: 3,
			};

			await loggedInClient.put(`${cardNode1.id}/position`, params);

			const result = await em.findOneOrFail(BoardNodeEntity, cardNode1.id);

			expect(result.path).toEqual(pathOfChildren(targetColumn));
			expect(result.position).toEqual(3);
		});

		describe('when moving a card within the same column', () => {
			it('should keep the card parent', async () => {
				const { loggedInClient, cardNode2, parentColumn } = await setup();

				const params: MoveCardBodyParams = {
					toColumnId: parentColumn.id,
					toPosition: 3,
				};

				await loggedInClient.put(`${cardNode2.id}/position`, params);

				const result = await em.findOneOrFail(BoardNodeEntity, cardNode2.id);
				expect(result.path).toEqual(pathOfChildren(parentColumn));
			});

			it('should update the card positions', async () => {
				const { loggedInClient, cardNode1, cardNode2, parentColumn } = await setup();

				const params: MoveCardBodyParams = {
					toColumnId: parentColumn.id,
					toPosition: 0,
				};

				await loggedInClient.put(`${cardNode2.id}/position`, params);

				const result1 = await em.findOneOrFail(BoardNodeEntity, cardNode1.id);
				const result2 = await em.findOneOrFail(BoardNodeEntity, cardNode2.id);
				expect(result1.position).toEqual(1);
				expect(result2.position).toEqual(0);
			});
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
			const { loggedInClient, cardNode1, targetColumn } = await setupNoAccess();

			const params: MoveCardBodyParams = {
				toColumnId: targetColumn.id,
				toPosition: 3,
			};

			const response = await loggedInClient.put(`${cardNode1.id}/position`, params);

			expect(response.status).toEqual(403);
		});
	});
});
