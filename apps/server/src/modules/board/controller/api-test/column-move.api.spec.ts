import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, courseFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { BoardExternalReferenceType } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import { cardEntityFactory, columnBoardEntityFactory, columnEntityFactory } from '../../testing';
import { MoveCardBodyParams, MoveColumnBodyParams } from '../dto';

const baseRouteName = '/columns';

describe(`column move (api)`, () => {
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

		const columnNodes = new Array(10)
			.fill(1)
			.map((_, i) => columnEntityFactory.withParent(columnBoardNode).build({ position: i }));
		const columnToMove = columnNodes[2];
		const cardNode = cardEntityFactory.withParent(columnToMove).build();

		await em.persistAndFlush([cardNode, ...columnNodes, columnBoardNode]);
		em.clear();

		const loggedInClient = await testApiClient.login(teacherAccount);

		return { loggedInClient, cardNode, columnToMove, columnBoardNode };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { loggedInClient, columnToMove, columnBoardNode } = await setup();

			const params: MoveColumnBodyParams = {
				toBoardId: columnBoardNode.id,
				toPosition: 5,
			};

			const response = await loggedInClient.put(`${columnToMove.id}/position`, params);

			expect(response.status).toEqual(204);
		});

		it('should actually move the column', async () => {
			const { loggedInClient, columnToMove, columnBoardNode } = await setup();

			const params: MoveColumnBodyParams = {
				toBoardId: columnBoardNode.id,
				toPosition: 5,
			};

			await loggedInClient.put(`${columnToMove.id}/position`, params);
			const result = await em.findOneOrFail(BoardNodeEntity, columnToMove.id);

			expect(result.position).toEqual(5);
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
			const { loggedInClient, columnToMove, columnBoardNode } = await setupNoAccess();

			const params: MoveColumnBodyParams = {
				toBoardId: columnBoardNode.id,
				toPosition: 5,
			};

			const response = await loggedInClient.put(`${columnToMove.id}/position`, params);

			expect(response.status).toEqual(403);
		});
	});
});
