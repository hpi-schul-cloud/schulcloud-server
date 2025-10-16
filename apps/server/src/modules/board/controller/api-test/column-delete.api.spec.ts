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

const baseRouteName = '/columns';

describe(`column delete (api)`, () => {
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
		const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
		const siblingColumnNode = columnEntityFactory.withParent(columnBoardNode).build();
		const cardNode = cardEntityFactory.withParent(columnNode).build();

		await em.persistAndFlush([cardNode, columnNode, columnBoardNode, siblingColumnNode]);
		em.clear();

		const loggedInClient = await testApiClient.login(teacherAccount);

		return { loggedInClient, cardNode, columnNode, columnBoardNode, siblingColumnNode };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { loggedInClient, columnNode } = await setup();

			const response = await loggedInClient.delete(columnNode.id);

			expect(response.status).toEqual(204);
		});

		it('should actually delete the column', async () => {
			const { loggedInClient, columnNode } = await setup();

			await loggedInClient.delete(columnNode.id);

			await expect(em.findOneOrFail(BoardNodeEntity, columnNode.id)).rejects.toThrow();
		});

		it('should actually delete cards of the column', async () => {
			const { loggedInClient, cardNode, columnNode } = await setup();

			await loggedInClient.delete(columnNode.id);

			await expect(em.findOneOrFail(BoardNodeEntity, cardNode.id)).rejects.toThrow();
		});

		it('should not delete siblings', async () => {
			const { loggedInClient, columnNode, siblingColumnNode } = await setup();

			await loggedInClient.delete(columnNode.id);

			await expect(em.findOneOrFail(BoardNodeEntity, columnNode.id)).rejects.toThrow();

			const siblingFromDb = await em.findOneOrFail(BoardNodeEntity, siblingColumnNode.id);
			expect(siblingFromDb).toBeDefined();
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
			const { loggedInClient, columnNode } = await setupNoAccess();

			const response = await loggedInClient.delete(columnNode.id);

			expect(response.status).toEqual(403);
		});
	});
});
