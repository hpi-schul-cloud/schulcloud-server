import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	cleanupCollections,
	courseFactory,
	userFactory,
} from '@shared/testing';
import { BoardExternalReferenceType, ContentElementType } from '../../domain';
import {
	cardEntityFactory,
	columnBoardEntityFactory,
	columnEntityFactory,
	fileElementEntityFactory,
	richTextElementEntityFactory,
	submissionContainerElementEntityFactory,
	submissionItemEntityFactory,
} from '../../testing';
import { SubmissionsResponse } from '../dto';

const baseRouteName = '/board-submissions';
describe('submission item lookup (api)', () => {
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

	describe('when user is teacher and we have 2 submission containers filled with submission items from 2 students', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const { studentAccount: studentAccount1, studentUser: studentUser1 } = UserAndAccountTestFactory.buildStudent();
			const { studentAccount: studentAccount2, studentUser: studentUser2 } = UserAndAccountTestFactory.buildStudent();
			const course = courseFactory.build({ teachers: [teacherUser], students: [studentUser1, studentUser2] });
			await em.persistAndFlush([
				studentAccount1,
				studentUser1,
				studentAccount2,
				studentUser2,
				teacherAccount,
				teacherUser,
				course,
			]);

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

			const cardNode = cardEntityFactory.withParent(columnNode).build();

			const submissionContainerNode1 = submissionContainerElementEntityFactory.withParent(cardNode).build();
			const submissionContainerNode2 = submissionContainerElementEntityFactory.withParent(cardNode).build();
			const item11 = submissionItemEntityFactory.withParent(submissionContainerNode1).build({
				userId: studentUser1.id,
			});
			const item12 = submissionItemEntityFactory.withParent(submissionContainerNode1).build({
				userId: studentUser2.id,
			});
			const item21 = submissionItemEntityFactory.withParent(submissionContainerNode2).build({
				userId: studentUser1.id,
			});
			const item22 = submissionItemEntityFactory
				.withParent(submissionContainerNode2)
				.build({ userId: studentUser2.id });

			await em.persistAndFlush([
				columnBoardNode,
				columnNode,
				cardNode,
				submissionContainerNode1,
				submissionContainerNode2,
				item11,
				item12,
				item21,
				item22,
			]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return {
				loggedInClient,
				teacherUser,
				columnBoardNode,
				columnNode,
				cardNode,
				submissionContainerNode1,
				submissionContainerNode2,
				item11,
				item12,
				item21,
				item22,
				studentUser1,
				studentUser2,
			};
		};
		it('should return status 200', async () => {
			const { loggedInClient, submissionContainerNode1 } = await setup();

			const response = await loggedInClient.get(`${submissionContainerNode1.id}`);
			expect(response.status).toEqual(200);
		});

		it('should return all items from container 1 as teacher', async () => {
			const { loggedInClient, submissionContainerNode1, item11, item12 } = await setup();

			const response = await loggedInClient.get(`${submissionContainerNode1.id}`);
			const body = response.body as SubmissionsResponse;
			const { submissionItemsResponse } = body;
			expect(submissionItemsResponse.length).toBe(2);
			expect(submissionItemsResponse.map((item) => item.id)).toContain(item11.id);
			expect(submissionItemsResponse.map((item) => item.id)).toContain(item12.id);
		});

		it('should return all items from container 2 as teacher', async () => {
			const { loggedInClient, submissionContainerNode2, item21, item22 } = await setup();

			const response = await loggedInClient.get(`${submissionContainerNode2.id}`);
			const body = response.body as SubmissionsResponse;
			const { submissionItemsResponse } = body;
			expect(submissionItemsResponse.length).toBe(2);
			expect(submissionItemsResponse.map((item) => item.id)).toContain(item21.id);
			expect(submissionItemsResponse.map((item) => item.id)).toContain(item22.id);
		});

		it('should return list of students', async () => {
			const { loggedInClient, submissionContainerNode1, studentUser1, studentUser2 } = await setup();

			const response = await loggedInClient.get(`${submissionContainerNode1.id}`);
			const body = response.body as SubmissionsResponse;
			const { users } = body;
			expect(users.length).toBe(2);
			const userIds = users.map((user) => user.userId);
			expect(userIds).toContain(studentUser1.id);
			expect(userIds).toContain(studentUser2.id);
		});
	});

	describe('when user is student and we have a submission container element filled with 2 submission items', () => {
		const setup = async () => {
			await cleanupCollections(em);

			// const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const { studentAccount: studentAccount1, studentUser: studentUser1 } = UserAndAccountTestFactory.buildStudent();
			const { studentAccount: studentAccount2, studentUser: studentUser2 } = UserAndAccountTestFactory.buildStudent();
			const course = courseFactory.build({ teachers: [], students: [studentUser1, studentUser2] });
			await em.persistAndFlush([studentAccount1, studentUser1, studentAccount2, studentUser2, course]);

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

			const cardNode = cardEntityFactory.withParent(columnNode).build();

			const submissionContainerNode = submissionContainerElementEntityFactory.withParent(cardNode).build();
			const item1 = submissionItemEntityFactory.withParent(submissionContainerNode).build({ userId: studentUser1.id });
			const item2 = submissionItemEntityFactory.withParent(submissionContainerNode).build({ userId: studentUser2.id });

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, submissionContainerNode, item1, item2]);
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount1);

			return {
				loggedInClient,
				columnBoardNode,
				columnNode,
				cardNode,
				submissionContainerNode,
				item1,
				item2,
			};
		};
		it('should return status 200', async () => {
			const { loggedInClient, submissionContainerNode } = await setup();

			const response = await loggedInClient.get(`${submissionContainerNode.id}`);
			expect(response.status).toEqual(200);
		});

		it('should return only own submission item', async () => {
			const { loggedInClient, submissionContainerNode, item1 } = await setup();

			const response = await loggedInClient.get(`${submissionContainerNode.id}`);
			const body = response.body as SubmissionsResponse;
			const { submissionItemsResponse } = body;
			expect(submissionItemsResponse.length).toBe(1);
			expect(submissionItemsResponse[0].id).toBe(item1.id);
		});
	});

	describe('when user is invalid', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const user = userFactory.build();
			const course = courseFactory.build({ teachers: [user] });

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

			await em.persistAndFlush([user, teacherAccount, teacherUser, course]);

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

			const cardNode = cardEntityFactory.withParent(columnNode).build();

			const submissionContainerNode = submissionContainerElementEntityFactory.withParent(cardNode).build();

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, submissionContainerNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, columnBoardNode, columnNode, cardNode, submissionContainerNode };
		};

		it('should return 403', async () => {
			const { loggedInClient, submissionContainerNode } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);

			const response = await loggedInClient.get(`${submissionContainerNode.id}`);

			expect(response.status).toEqual(403);
		});
	});

	describe('when submission item has child elements', () => {
		describe('when submission item has a RICH_TEXT child element', () => {
			const setup = async () => {
				await cleanupCollections(em);

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const course = courseFactory.build({ teachers: [teacherUser], students: [studentUser] });
				await em.persistAndFlush([studentAccount, studentUser, teacherAccount, teacherUser, course]);

				const columnBoardNode = columnBoardEntityFactory.build({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});

				const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

				const cardNode = cardEntityFactory.withParent(columnNode).build();

				const submissionContainer = submissionContainerElementEntityFactory.withParent(cardNode).build();
				const submissionItem = submissionItemEntityFactory
					.withParent(submissionContainer)
					.build({ userId: studentUser.id });
				const richTextElement = richTextElementEntityFactory.withParent(submissionItem).build();

				await em.persistAndFlush([
					columnBoardNode,
					columnNode,
					cardNode,
					submissionContainer,
					submissionItem,
					richTextElement,
				]);

				const loggedInClient = await testApiClient.login(studentAccount);

				return {
					loggedInClient,
					submissionContainer,
					submissionItem,
					richTextElement,
				};
			};

			it('should return all RICH_TEXT child elements', async () => {
				const { loggedInClient, submissionContainer, richTextElement } = await setup();

				const response = await loggedInClient.get(`${submissionContainer.id}`);
				const submissionItemResponse = (response.body as SubmissionsResponse).submissionItemsResponse[0];
				const richTextElementResponse = submissionItemResponse.elements.filter(
					(element) => element.type === ContentElementType.RICH_TEXT
				);

				expect(richTextElementResponse[0].id).toEqual(richTextElement.id);
			});
		});

		describe('when submission item has a FILE child element', () => {
			const setup = async () => {
				await cleanupCollections(em);

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const course = courseFactory.build({ teachers: [teacherUser], students: [studentUser] });
				await em.persistAndFlush([studentAccount, studentUser, teacherAccount, teacherUser, course]);

				const columnBoardNode = columnBoardEntityFactory.build({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});

				const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

				const cardNode = cardEntityFactory.withParent(columnNode).build();

				const submissionContainer = submissionContainerElementEntityFactory.withParent(cardNode).build();
				const submissionItem = submissionItemEntityFactory
					.withParent(submissionContainer)
					.build({ userId: studentUser.id });
				const fileElement = fileElementEntityFactory.withParent(submissionItem).build();

				await em.persistAndFlush([
					columnBoardNode,
					columnNode,
					cardNode,
					submissionContainer,
					submissionItem,
					fileElement,
				]);

				const loggedInClient = await testApiClient.login(studentAccount);

				return {
					loggedInClient,
					submissionContainer,
					submissionItem,
					fileElement,
				};
			};
			it('should return all FILE child elements', async () => {
				const { loggedInClient, submissionContainer, fileElement } = await setup();

				const response = await loggedInClient.get(`${submissionContainer.id}`);
				const submissionItemResponse = (response.body as SubmissionsResponse).submissionItemsResponse[0];
				const fileElementResponse = submissionItemResponse.elements.filter(
					(element) => element.type === ContentElementType.FILE
				);

				expect(fileElementResponse[0].id).toEqual(fileElement.id);
			});
		});
	});
});
