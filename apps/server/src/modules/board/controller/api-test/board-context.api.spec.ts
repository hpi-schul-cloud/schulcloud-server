import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType } from '@shared/domain/domainobject/board/types/board-external-reference';
import { cleanupCollections } from '@shared/testing/cleanup-collections';
import { columnBoardNodeFactory } from '@shared/testing/factory/boardnode/column-board-node.factory';
import { courseFactory } from '@shared/testing/factory/course.factory';
import { UserAndAccountTestFactory } from '@shared/testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@shared/testing/test-api-client';
import { ServerTestModule } from '@src/modules/server/server.module';
import { BoardContextResponse } from '../dto/board/board-context.reponse';

const baseRouteName = '/boards';

describe('board get context (api)', () => {
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

			const course = courseFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherUser, teacherAccount, course]);

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			await em.persistAndFlush([columnBoardNode]);
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

			const expectedBody: BoardContextResponse = {
				id: columnBoardNode.context.id,
				type: columnBoardNode.context.type,
			};

			expect(response.body).toEqual(expectedBody);
		});
	});
});
