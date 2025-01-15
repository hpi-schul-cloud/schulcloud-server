import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { courseFactory } from '@testing/factory/course.factory';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType } from '../../domain';
import {
	cardEntityFactory,
	columnBoardEntityFactory,
	columnEntityFactory,
	drawingElementEntityFactory,
} from '../../testing';

const baseRouteName = '/elements';
describe('drawing permission check (api)', () => {
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

	describe('when user is a valid teacher who is part of course', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherAccount, teacherUser, course]);

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

			const cardNode = cardEntityFactory.withParent(columnNode).build();

			const drawingItemNode = drawingElementEntityFactory.withParent(cardNode).build();

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, drawingItemNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, teacherUser, columnBoardNode, columnNode, cardNode, drawingItemNode };
		};

		it('should return status 200', async () => {
			const { loggedInClient, drawingItemNode } = await setup();

			const response = await loggedInClient.get(`${drawingItemNode.id}/permission`);

			expect(response.status).toEqual(200);
		});
	});

	describe('when only teacher is part of course', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

			const course = courseFactory.build({ students: [teacherUser] });
			await em.persistAndFlush([teacherAccount, teacherUser, course, studentAccount, studentUser]);

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

			const cardNode = cardEntityFactory.withParent(columnNode).build();

			const drawingItemNode = drawingElementEntityFactory.withParent(cardNode).build();

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, drawingItemNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount);

			return { loggedInClient, studentUser, columnBoardNode, columnNode, cardNode, drawingItemNode };
		};

		it('should return status 403 for student not assigned to course', async () => {
			const { loggedInClient, drawingItemNode } = await setup();

			const response = await loggedInClient.get(`${drawingItemNode.id}/permission`);

			expect(response.status).toEqual(403);
		});
	});

	describe('when asking for non-existing resource', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			await em.persistAndFlush([teacherAccount, teacherUser]);

			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient };
		};

		it('should return status 404 for wrong id', async () => {
			const { loggedInClient } = await setup();
			const wrongRandomId = '655b048616056135293d1e63';

			const response = await loggedInClient.get(`${wrongRandomId}/permission`);

			expect(response.status).toEqual(404);
		});
	});
});
