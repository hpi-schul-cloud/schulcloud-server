import { INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { drawingElementNodeFactory } from '@shared/testing/factory/boardnode/drawing-element-node.factory';
import { TldrawTestModule } from '@modules/tldraw';

const baseRouteName = '/tldraw-document';
describe('tldraw controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [TldrawTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('with valid user', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherAccount, teacherUser, course]);

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });

			const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });

			const drawingItemNode = drawingElementNodeFactory.buildWithId({ parent: cardNode });

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, drawingItemNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, teacherUser, columnBoardNode, columnNode, cardNode, drawingItemNode };
		};

		it('should return status 200 for delete', async () => {
			const { loggedInClient, drawingItemNode } = await setup();

			const response = await loggedInClient.delete(`${drawingItemNode.id}`);

			expect(response.status).toEqual(200);
		});
	});
});
