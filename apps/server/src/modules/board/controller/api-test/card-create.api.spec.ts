import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType, ContentElementType } from '../../domain';
import { columnBoardEntityFactory, columnEntityFactory } from '../../testing';
import { CardResponse } from '../dto';

const baseRouteName = '/columns';

describe(`card create (api)`, () => {
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

	const setup = async () => {
		await cleanupCollections(em);
		const { teacherAccount: account, teacherUser: user } = UserAndAccountTestFactory.buildTeacher();
		const course = courseEntityFactory.build({ teachers: [user] });
		await em.persistAndFlush([user, account, course]);

		const columnBoardNode = columnBoardEntityFactory.build({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});

		const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

		await em.persistAndFlush([columnBoardNode, columnNode]);
		em.clear();

		const createCardBodyParams = {
			requiredEmptyElements: [ContentElementType.RICH_TEXT, ContentElementType.FILE, ContentElementType.LINK],
		};

		const loggedInClient = await apiClient.login(account);

		return { user, columnBoardNode, columnNode, createCardBodyParams, loggedInClient };
	};

	describe('with valid user', () => {
		it('should return status 201', async () => {
			const { columnNode, loggedInClient } = await setup();

			const response = await loggedInClient.post(`${columnNode.id}/cards`);

			expect(response.status).toEqual(201);
		});

		it('should return the created card', async () => {
			const { columnNode, loggedInClient } = await setup();

			const response = await loggedInClient.post(`${columnNode.id}/cards`);
			const result = response.body as CardResponse;

			expect(result.id).toBeDefined();
		});
		it('created card should contain empty text, file and link elements', async () => {
			const { columnNode, createCardBodyParams, loggedInClient } = await setup();

			const expectedEmptyElements = [
				{
					type: 'richText',
					content: {
						text: '',
					},
				},
				{
					type: 'file',
					content: {
						caption: '',
						alternativeText: '',
					},
				},
				{
					type: 'link',
					content: {
						url: '',
					},
				},
			];

			const response = await loggedInClient.post(`${columnNode.id}/cards`, createCardBodyParams);
			const result = response.body as CardResponse;
			const { elements } = result;

			expect(elements[0]).toMatchObject(expectedEmptyElements[0]);
			expect(elements[1]).toMatchObject(expectedEmptyElements[1]);
			expect(elements[2]).toMatchObject(expectedEmptyElements[2]);
		});
		it('should return status 400 as the content element is unknown', async () => {
			const { columnNode, loggedInClient } = await setup();

			const invalidBodyParams = {
				requiredEmptyElements: ['unknown-content-element'],
			};

			const response = await loggedInClient.post(`${columnNode.id}/cards`, invalidBodyParams);

			expect(response.status).toEqual(400);
		});
	});

	describe('with invalid user', () => {
		it('should return status 403', async () => {
			const { columnNode } = await setup();
			const { teacherAccount: account, teacherUser: user } = UserAndAccountTestFactory.buildTeacher();
			await em.persistAndFlush([user, account]);

			const api = new TestApiClient(app, baseRouteName);
			const loggedInClient = await api.login(account);

			const response = await loggedInClient.post(`${columnNode.id}/cards`);

			expect(response.status).toEqual(403);
		});
	});

	describe('with not logged in user', () => {
		it('should return status 403', async () => {
			const { columnNode } = await setup();
			const { teacherAccount: account, teacherUser: user } = UserAndAccountTestFactory.buildTeacher();
			await em.persistAndFlush([user, account]);

			const response = await apiClient.post(`${columnNode.id}/cards`);

			expect(response.status).toEqual(401);
		});
	});
});
