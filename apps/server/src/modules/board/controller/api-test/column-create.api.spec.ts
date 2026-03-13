import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType } from '../../domain';
import { columnBoardEntityFactory } from '../../testing';
import { ColumnResponse } from '../dto';

const baseRouteName = '/boards';

describe(`board create (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let apiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		apiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('with valid user', () => {
		const setup = async () => {
			await cleanupCollections(em);
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseEntityFactory.build({ school: teacherUser.school, teachers: [teacherUser] });
			await em.persist([teacherUser, teacherAccount, course]).flush();

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			await em.persist([columnBoardNode]).flush();
			em.clear();

			const loggedInClient = await apiClient.login(teacherAccount);

			return { loggedInClient, columnBoardNode };
		};

		it('should return status 201', async () => {
			const { columnBoardNode, loggedInClient } = await setup();

			const response = await loggedInClient.post(`${columnBoardNode.id}/columns`);

			expect(response.status).toEqual(201);
		});

		it('should return the created column', async () => {
			const { columnBoardNode, loggedInClient } = await setup();

			const result = await loggedInClient.post(`${columnBoardNode.id}/columns`);
			const response = result.body as ColumnResponse;

			expect(response.id).toBeDefined();
		});
	});

	describe('with unauthorized user', () => {
		const setup = async () => {
			await cleanupCollections(em);
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseEntityFactory.build({ teachers: [] });
			await em.persist([teacherUser, teacherAccount, course]).flush();

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			await em.persist([columnBoardNode]).flush();
			em.clear();

			const loggedInClient = await apiClient.login(teacherAccount);

			return { loggedInClient, columnBoardNode };
		};

		it('should return status 403', async () => {
			const { columnBoardNode, loggedInClient } = await setup();

			const response = await loggedInClient.post(`${columnBoardNode.id}/columns`);

			expect(response.status).toEqual(403);
		});
	});

	describe('with not logged in user', () => {
		const setup = async () => {
			await cleanupCollections(em);
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseEntityFactory.build({ teachers: [] });
			await em.persist([teacherUser, teacherAccount, course]).flush();

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			await em.persist([columnBoardNode]).flush();
			em.clear();

			return { columnBoardNode };
		};

		it('should return status 403', async () => {
			const { columnBoardNode } = await setup();

			const response = await apiClient.post(`${columnBoardNode.id}/columns`);

			expect(response.status).toEqual(401);
		});
	});
});
