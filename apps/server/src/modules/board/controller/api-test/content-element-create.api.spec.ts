import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType, ContentElementType, RichTextElementNode } from '@shared/domain';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { ServerTestModule } from '@src/modules/server/server.module';
import { AnyContentElementResponse } from '../dto';

const baseRouteName = '/cards';

describe(`content element create (api)`, () => {
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

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, columnBoardNode, columnNode, cardNode };
		};

		it('should return status 201', async () => {
			const { loggedInClient, cardNode } = await setup();

			const response = await loggedInClient.post(`${cardNode.id}/elements`, { type: ContentElementType.RICH_TEXT });

			expect(response.statusCode).toEqual(201);
		});

		it('should return the created content element of type RICH_TEXT', async () => {
			const { loggedInClient, cardNode } = await setup();

			const response = await loggedInClient.post(`${cardNode.id}/elements`, { type: ContentElementType.RICH_TEXT });

			expect((response.body as AnyContentElementResponse).type).toEqual(ContentElementType.RICH_TEXT);
		});

		it('should return the created content element of type FILE', async () => {
			const { loggedInClient, cardNode } = await setup();

			const response = await loggedInClient.post(`${cardNode.id}/elements`, { type: ContentElementType.FILE });

			expect((response.body as AnyContentElementResponse).type).toEqual(ContentElementType.FILE);
		});

		it('should return the created content element of type EXTERNAL_TOOL', async () => {
			const { loggedInClient, cardNode } = await setup();

			const response = await loggedInClient.post(`${cardNode.id}/elements`, { type: ContentElementType.EXTERNAL_TOOL });

			expect((response.body as AnyContentElementResponse).type).toEqual(ContentElementType.EXTERNAL_TOOL);
		});

		it('should return the created content element of type SUBMISSION_CONTAINER', async () => {
			const { loggedInClient, cardNode } = await setup();

			const response = await loggedInClient.post(`${cardNode.id}/elements`, {
				type: ContentElementType.SUBMISSION_CONTAINER,
			});

			expect((response.body as AnyContentElementResponse).type).toEqual(ContentElementType.SUBMISSION_CONTAINER);
		});

		it('should actually create the content element', async () => {
			const { loggedInClient, cardNode } = await setup();
			const response = await loggedInClient.post(`${cardNode.id}/elements`, { type: ContentElementType.RICH_TEXT });

			const elementId = (response.body as AnyContentElementResponse).id;

			const result = await em.findOneOrFail(RichTextElementNode, elementId);
			expect(result.id).toEqual(elementId);
		});

		it('should throw an error if toPosition param is not a number', async () => {
			const { loggedInClient, cardNode } = await setup();

			const response = await loggedInClient.post(`${cardNode.id}/elements`, {
				type: ContentElementType.RICH_TEXT,
				toPosition: 'not a number',
			});

			expect(response.statusCode).toEqual(400);
		});

		it('should throw an error if toPosition param is a negative number', async () => {
			const { loggedInClient, cardNode } = await setup();

			const response = await loggedInClient.post(`${cardNode.id}/elements`, {
				type: ContentElementType.RICH_TEXT,
				toPosition: -1,
			});

			expect(response.statusCode).toEqual(400);
		});
	});

	describe('with invalid user', () => {
		describe('with teacher not belonging to course', () => {
			const setup = async () => {
				await cleanupCollections(em);
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const course = courseFactory.build({});
				await em.persistAndFlush([teacherAccount, teacherUser, course]);

				const columnBoardNode = columnBoardNodeFactory.buildWithId({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});
				const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
				const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });

				await em.persistAndFlush([columnBoardNode, columnNode, cardNode]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, columnBoardNode, columnNode, cardNode };
			};

			it('should return status 403', async () => {
				const { cardNode, loggedInClient } = await setup();

				const response = await loggedInClient.post(`${cardNode.id}/elements`, { type: ContentElementType.RICH_TEXT });

				expect(response.statusCode).toEqual(403);
			});
		});

		describe('with student belonging to course', () => {
			const setup = async () => {
				await cleanupCollections(em);
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const course = courseFactory.build({ students: [studentUser] });
				await em.persistAndFlush([studentAccount, studentUser, course]);

				const columnBoardNode = columnBoardNodeFactory.buildWithId({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});
				const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
				const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });

				await em.persistAndFlush([columnBoardNode, columnNode, cardNode]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, columnBoardNode, columnNode, cardNode };
			};

			it('should return status 403', async () => {
				const { cardNode, loggedInClient } = await setup();

				const response = await loggedInClient.post(`${cardNode.id}/elements`, { type: ContentElementType.RICH_TEXT });

				expect(response.statusCode).toEqual(403);
			});
		});
	});
});
