import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType } from '../../domain';
import { columnBoardEntityFactory } from '../../testing';

const baseRouteName = '/boards';

describe('board get context in course (api)', () => {
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

	describe('with valid user', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

			const course = courseEntityFactory.build({ school: teacherUser.school, teachers: [teacherUser] });
			await em.persist([teacherUser, teacherAccount, course]).flush();

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			await em.persist([columnBoardNode]).flush();
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, columnBoardNode };
		};

		it('should return status 200', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const response = await loggedInClient.get(`${columnBoardNode.id}/context`);

			expect(response.status).toEqual(200);
		});

		it('should return the context', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const response = await loggedInClient.get(`${columnBoardNode.id}/context`);

			expect(response.body).toEqual({ id: columnBoardNode.context?.id, type: columnBoardNode.context?.type });
		});
	});
});
