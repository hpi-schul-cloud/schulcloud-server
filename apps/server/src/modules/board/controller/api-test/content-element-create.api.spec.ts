import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory, cleanupCollections, courseFactory } from '@shared/testing';
import { BoardNodeEntity } from '../../repo';
import { BoardExternalReferenceType, ContentElementType } from '../../domain';
import {
	cardEntityFactory,
	columnBoardEntityFactory,
	columnEntityFactory,
	submissionContainerElementEntityFactory,
	submissionItemEntityFactory,
} from '../../testing';
import { AnyContentElementResponse, SubmissionContainerElementResponse } from '../dto';

const baseRouteName = '/cards';
const submissionRouteName = '/board-submissions';

describe(`content element create (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let testApiClientSubmission: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
		testApiClientSubmission = new TestApiClient(app, submissionRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when the parent of the element is a card node', () => {
		describe('with valid user', () => {
			const setup = async () => {
				await cleanupCollections(em);

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const course = courseFactory.build({ teachers: [teacherUser] });
				await em.persistAndFlush([teacherAccount, teacherUser, course]);

				const columnBoardNode = columnBoardEntityFactory.buildWithId({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});
				const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
				const cardNode = cardEntityFactory.withParent(columnNode).build();

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

				const response = await loggedInClient.post(`${cardNode.id}/elements`, {
					type: ContentElementType.EXTERNAL_TOOL,
				});

				expect((response.body as AnyContentElementResponse).type).toEqual(ContentElementType.EXTERNAL_TOOL);
			});

			it('should return the created content element of type SUBMISSION_CONTAINER with dueDate set to null', async () => {
				const { loggedInClient, cardNode } = await setup();

				const response = await loggedInClient.post(`${cardNode.id}/elements`, {
					type: ContentElementType.SUBMISSION_CONTAINER,
				});

				expect((response.body as AnyContentElementResponse).type).toEqual(ContentElementType.SUBMISSION_CONTAINER);
				expect((response.body as SubmissionContainerElementResponse).content.dueDate).toBeNull();
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

					const course = courseFactory.build({});
					await em.persistAndFlush([teacherAccount, teacherUser, course]);

					const columnBoardNode = columnBoardEntityFactory.buildWithId({
						context: { id: course.id, type: BoardExternalReferenceType.Course },
					});
					const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
					const cardNode = cardEntityFactory.withParent(columnNode).build();

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
				describe('when the parent of the element is a card node', () => {
					const setup = async () => {
						await cleanupCollections(em);
						const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

						const course = courseFactory.build({ students: [studentUser] });
						await em.persistAndFlush([studentAccount, studentUser, course]);

						const columnBoardNode = columnBoardEntityFactory.buildWithId({
							context: { id: course.id, type: BoardExternalReferenceType.Course },
						});
						const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
						const cardNode = cardEntityFactory.withParent(columnNode).build();

						await em.persistAndFlush([columnBoardNode, columnNode, cardNode]);
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
				describe('when the parent of the element is a submission item', () => {});
			});
		});
	});

	describe('when the parent of the element is a submission item', () => {
		describe('with user being the owner of the parent submission item', () => {
			const setup = async () => {
				await cleanupCollections(em);

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const course = courseFactory.build({ teachers: [teacherUser], students: [studentUser] });

				await em.persistAndFlush([teacherAccount, teacherUser, studentAccount, studentUser, course]);

				const columnBoardNode = columnBoardEntityFactory.buildWithId({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});
				const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
				const cardNode = cardEntityFactory.withParent(columnNode).build();
				const submissionElementContainerNode = submissionContainerElementEntityFactory.withParent(cardNode).build();
				const submissionItemNode = submissionItemEntityFactory.withParent(submissionElementContainerNode).build({
					userId: studentUser.id,
				});

				await em.persistAndFlush([
					columnBoardNode,
					columnNode,
					cardNode,
					submissionElementContainerNode,
					submissionItemNode,
				]);
				em.clear();

				const loggedInClient = await testApiClientSubmission.login(studentAccount);

				return { loggedInClient, cardNode, submissionItemNode };
			};

			it('should return status 201', async () => {
				const { loggedInClient, submissionItemNode } = await setup();

				const response = await loggedInClient.post(`${submissionItemNode.id}/elements`, {
					type: ContentElementType.RICH_TEXT,
				});

				expect(response.statusCode).toEqual(201);
			});

			it('should return the created content element of type RICH_TEXT', async () => {
				const { loggedInClient, submissionItemNode } = await setup();

				const response = await loggedInClient.post(`${submissionItemNode.id}/elements`, {
					type: ContentElementType.RICH_TEXT,
				});

				expect((response.body as AnyContentElementResponse).type).toEqual(ContentElementType.RICH_TEXT);
			});

			it('should return the created content element of type FILE', async () => {
				const { loggedInClient, submissionItemNode } = await setup();

				const response = await loggedInClient.post(`${submissionItemNode.id}/elements`, {
					type: ContentElementType.FILE,
				});

				expect((response.body as AnyContentElementResponse).type).toEqual(ContentElementType.FILE);
			});

			it('should throw if element is not RICH_TEXT or FILE', async () => {
				const { loggedInClient, submissionItemNode } = await setup();

				const response = await loggedInClient.post(`${submissionItemNode.id}/elements`, {
					type: ContentElementType.EXTERNAL_TOOL,
				});

				expect(response.statusCode).toEqual(400);
			});

			it('should actually create the content element', async () => {
				const { loggedInClient, submissionItemNode } = await setup();
				const response = await loggedInClient.post(`${submissionItemNode.id}/elements`, {
					type: ContentElementType.RICH_TEXT,
				});

				const elementId = (response.body as AnyContentElementResponse).id;

				const result = await em.findOneOrFail(BoardNodeEntity, elementId);
				expect(result.id).toEqual(elementId);
			});
		});
		describe('with user not being the owner of the parent submission item', () => {
			const setup = async () => {
				await cleanupCollections(em);

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const course = courseFactory.build({ teachers: [teacherUser], students: [studentUser] });

				await em.persistAndFlush([teacherAccount, teacherUser, studentAccount, studentUser, course]);

				const columnBoardNode = columnBoardEntityFactory.buildWithId({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});
				const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
				const cardNode = cardEntityFactory.withParent(columnNode).build();
				const submissionElementContainerNode = submissionContainerElementEntityFactory.withParent(cardNode).build();
				const submissionItemNode = submissionItemEntityFactory.withParent(submissionElementContainerNode).build({
					userId: teacherUser.id,
				});

				await em.persistAndFlush([
					columnBoardNode,
					columnNode,
					cardNode,
					submissionElementContainerNode,
					submissionItemNode,
				]);
				em.clear();

				const loggedInClient = await testApiClientSubmission.login(studentAccount);

				return { loggedInClient, cardNode, submissionItemNode };
			};
			it('should return status 403', async () => {
				const { loggedInClient, submissionItemNode } = await setup();

				const response = await loggedInClient.post(`${submissionItemNode.id}/elements`, {
					type: ContentElementType.RICH_TEXT,
				});

				expect(response.statusCode).toEqual(403);
			});
		});
		describe('with user not a student', () => {
			const setup = async () => {
				await cleanupCollections(em);

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const course = courseFactory.build({ teachers: [teacherUser] });

				await em.persistAndFlush([teacherAccount, teacherUser, course]);

				const columnBoardNode = columnBoardEntityFactory.buildWithId({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});
				const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
				const cardNode = cardEntityFactory.withParent(columnNode).build();
				const submissionElementContainerNode = submissionContainerElementEntityFactory.withParent(cardNode).build();
				const submissionItemNode = submissionItemEntityFactory
					.withParent(submissionElementContainerNode)
					.build({ userId: teacherUser.id });

				await em.persistAndFlush([
					columnBoardNode,
					columnNode,
					cardNode,
					submissionElementContainerNode,
					submissionItemNode,
				]);
				em.clear();

				const loggedInClient = await testApiClientSubmission.login(teacherAccount);

				return { loggedInClient, cardNode, submissionItemNode };
			};
			it('should return status 403', async () => {
				const { loggedInClient, submissionItemNode } = await setup();

				const response = await loggedInClient.post(`${submissionItemNode.id}/elements`, {
					type: ContentElementType.RICH_TEXT,
				});

				expect(response.statusCode).toEqual(403);
			});
		});
		describe('with user not belonging to course', () => {
			const setup = async () => {
				await cleanupCollections(em);

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const course = courseFactory.build({ teachers: [teacherUser] });

				await em.persistAndFlush([teacherAccount, teacherUser, studentAccount, studentUser, course]);

				const columnBoardNode = columnBoardEntityFactory.buildWithId({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});
				const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
				const cardNode = cardEntityFactory.withParent(columnNode).build();
				const submissionElementContainerNode = submissionContainerElementEntityFactory.withParent(cardNode).build();
				const submissionItemNode = submissionItemEntityFactory.withParent(submissionElementContainerNode).build({
					userId: studentUser.id,
				});

				await em.persistAndFlush([
					columnBoardNode,
					columnNode,
					cardNode,
					submissionElementContainerNode,
					submissionItemNode,
				]);
				em.clear();

				const loggedInClient = await testApiClientSubmission.login(studentAccount);

				return { loggedInClient, cardNode, submissionItemNode };
			};
			it('should return status 403', async () => {
				const { loggedInClient, submissionItemNode } = await setup();

				const response = await loggedInClient.post(`${submissionItemNode.id}/elements`, {
					type: ContentElementType.RICH_TEXT,
				});

				expect(response.statusCode).toEqual(403);
			});
		});
	});
});
