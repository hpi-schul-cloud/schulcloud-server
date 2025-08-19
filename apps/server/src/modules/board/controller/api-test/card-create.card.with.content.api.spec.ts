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
import { InputFormat } from '@shared/domain/types/input-format.types';
import { CreateCardImportBodyParams } from '../dto/card/create-card.import.body.params';

const baseRouteName = '/columns';

describe(`card create with content (api)`, () => {
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

		const createCardImportBodyParams: CreateCardImportBodyParams = new CreateCardImportBodyParams('New Card', [
			{
				data: {
					type: ContentElementType.RICH_TEXT,
					content: { text: 'This is a rich text element.', inputFormat: InputFormat.RICH_TEXT_CK5 },
				},
			},
		]);

		const loggedInClient = await apiClient.login(account);

		return { user, columnBoardNode, columnNode, createCardImportBodyParams, loggedInClient };
	};

	describe('with valid user', () => {
		it('should return status 201', async () => {
			const { columnNode, loggedInClient, createCardImportBodyParams } = await setup();

			const response = await loggedInClient.post(`${columnNode.id}/cardsContent`, createCardImportBodyParams);

			expect(response.status).toEqual(201);
		});

		it('should return the created card', async () => {
			const { columnNode, loggedInClient, createCardImportBodyParams } = await setup();

			const response = await loggedInClient.post(`${columnNode.id}/cardsContent`, createCardImportBodyParams);
			const result = response.body as CardResponse;

			expect(result.id).toBeDefined();
		});
		it('created card should contain rich text', async () => {
			const { columnNode, createCardImportBodyParams, loggedInClient } = await setup();

			const response = await loggedInClient.post(`${columnNode.id}/cardsContent`, createCardImportBodyParams);
			const result = response.body as CardResponse;

			expect(result.elements[0].type).toEqual(ContentElementType.RICH_TEXT);
		});
	});

	describe('with invalid user', () => {
		it('should return status 403', async () => {
			const { columnNode, createCardImportBodyParams } = await setup();
			const { teacherAccount: account, teacherUser: user } = UserAndAccountTestFactory.buildTeacher();
			await em.persistAndFlush([user, account]);

			const api = new TestApiClient(app, baseRouteName);
			const loggedInClient = await api.login(account);

			const response = await loggedInClient.post(`${columnNode.id}/cardsContent`, createCardImportBodyParams);

			expect(response.status).toEqual(403);
		});
	});

	describe('with not logged in user', () => {
		it('should return status 403', async () => {
			const { columnNode, createCardImportBodyParams } = await setup();
			const { teacherAccount: account, teacherUser: user } = UserAndAccountTestFactory.buildTeacher();
			await em.persistAndFlush([user, account]);

			const response = await apiClient.post(`${columnNode.id}/cardsContent`, createCardImportBodyParams);

			expect(response.status).toEqual(401);
		});
	});
});
