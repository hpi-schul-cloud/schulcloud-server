import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, courseFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { BoardExternalReferenceType } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import { columnBoardEntityFactory, columnEntityFactory } from '../../testing';

const baseRouteName = '/boards';

describe(`board delete (api)`, () => {
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

		await em.persistAndFlush([columnBoardNode, columnNode]);
		em.clear();

		const loggedInClient = await testApiClient.login(teacherAccount);

		return { loggedInClient, columnBoardNode, columnNode };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const response = await loggedInClient.delete(columnBoardNode.id);

			expect(response.status).toEqual(204);
		});

		it('should actually delete the board', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			await loggedInClient.delete(columnBoardNode.id);

			await expect(em.findOneOrFail(BoardNodeEntity, columnBoardNode.id)).rejects.toThrow();
		});

		it('should actually delete columns of the board', async () => {
			const { loggedInClient, columnNode, columnBoardNode } = await setup();

			await loggedInClient.delete(columnBoardNode.id);

			await expect(em.findOneOrFail(BoardNodeEntity, columnNode.id)).rejects.toThrow();
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
			const { loggedInClient, columnBoardNode } = await setupNoAccess();

			const response = await loggedInClient.delete(columnBoardNode.id);

			expect(response.status).toEqual(403);
		});
	});
});
