import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType, ContentElementType } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import { cardEntityFactory, columnBoardEntityFactory, columnEntityFactory } from '../../testing';
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

	describe('when the parent of the element is a card node', () => {
		describe('with valid user', () => {
			const setup = async () => {
				await cleanupCollections(em);

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const course = courseEntityFactory.build({ teachers: [teacherUser], school: teacherUser.school });
				await em.persist([teacherAccount, teacherUser, course]).flush();

				const columnBoardNode = columnBoardEntityFactory.build({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});
				const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
				const cardNode = cardEntityFactory.withParent(columnNode).build();

				await em.persist([columnBoardNode, columnNode, cardNode]).flush();
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

				const response = await loggedInClient.post(`${cardNode.id}/elements`, {
					type: ContentElementType.EXTERNAL_TOOL,
				});

				expect((response.body as AnyContentElementResponse).type).toEqual(ContentElementType.EXTERNAL_TOOL);
			});

			it('should return the created content element of type H5P', async () => {
				const { loggedInClient, cardNode } = await setup();

				const response = await loggedInClient.post(`${cardNode.id}/elements`, {
					type: ContentElementType.H5P,
				});

				expect((response.body as AnyContentElementResponse).type).toEqual(ContentElementType.H5P);
			});

			it('should return the created content element of type COLABORATIVE_TEXT_EDITOR', async () => {
				const { loggedInClient, cardNode } = await setup();

				const response = await loggedInClient.post(`${cardNode.id}/elements`, {
					type: ContentElementType.COLLABORATIVE_TEXT_EDITOR,
				});

				expect((response.body as AnyContentElementResponse).type).toEqual(ContentElementType.COLLABORATIVE_TEXT_EDITOR);
			});

			it('should actually create the content element', async () => {
				const { loggedInClient, cardNode } = await setup();
				const response = await loggedInClient.post(`${cardNode.id}/elements`, { type: ContentElementType.RICH_TEXT });

				const elementId = (response.body as AnyContentElementResponse).id;

				const result = await em.findOneOrFail(BoardNodeEntity, elementId);
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

			it('should return the created content element of type DRAWING', async () => {
				const { loggedInClient, cardNode } = await setup();

				const response = await loggedInClient.post(`${cardNode.id}/elements`, { type: ContentElementType.DRAWING });

				expect((response.body as AnyContentElementResponse).type).toEqual(ContentElementType.DRAWING);
			});

			it('should actually create the DRAWING element', async () => {
				const { loggedInClient, cardNode } = await setup();
				const response = await loggedInClient.post(`${cardNode.id}/elements`, { type: ContentElementType.DRAWING });

				const elementId = (response.body as AnyContentElementResponse).id;

				const result = await em.findOneOrFail(BoardNodeEntity, elementId);
				expect(result.id).toEqual(elementId);
			});
		});
		describe('with invalid user', () => {
			describe('with teacher not belonging to course', () => {
				const setup = async () => {
					await cleanupCollections(em);
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

					const course = courseEntityFactory.build({});
					await em.persist([teacherAccount, teacherUser, course]).flush();

					const columnBoardNode = columnBoardEntityFactory.build({
						context: { id: course.id, type: BoardExternalReferenceType.Course },
					});
					const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
					const cardNode = cardEntityFactory.withParent(columnNode).build();

					await em.persist([columnBoardNode, columnNode, cardNode]).flush();
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
				describe('when the parent of the element is a card node', () => {
					const setup = async () => {
						await cleanupCollections(em);
						const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

						const course = courseEntityFactory.build({ students: [studentUser] });
						await em.persist([studentAccount, studentUser, course]).flush();

						const columnBoardNode = columnBoardEntityFactory.build({
							context: { id: course.id, type: BoardExternalReferenceType.Course },
						});
						const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
						const cardNode = cardEntityFactory.withParent(columnNode).build();

						await em.persist([columnBoardNode, columnNode, cardNode]).flush();
						em.clear();

						const loggedInClient = await testApiClient.login(studentAccount);

						return { loggedInClient, columnBoardNode, columnNode, cardNode };
					};

					it('should return status 403', async () => {
						const { cardNode, loggedInClient } = await setup();

						const response = await loggedInClient.post(`${cardNode.id}/elements`, {
							type: ContentElementType.RICH_TEXT,
						});

						expect(response.statusCode).toEqual(403);
					});

					it('should return status 403 for DRAWING', async () => {
						const { cardNode, loggedInClient } = await setup();

						const response = await loggedInClient.post(`${cardNode.id}/elements`, {
							type: ContentElementType.DRAWING,
						});

						expect(response.statusCode).toEqual(403);
					});
				});
			});
		});
	});
});
