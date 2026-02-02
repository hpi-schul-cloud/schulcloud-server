import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { ServerTestModule } from '@modules/server';
import { userFactory } from '@modules/user/testing';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import {
	cardEntityFactory,
	columnBoardEntityFactory,
	columnEntityFactory,
	submissionContainerElementEntityFactory,
} from '../../testing';
import { SubmissionItemResponse } from '../dto';

const baseRouteName = '/elements';

describe('submission create (api)', () => {
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

	describe('when user is a student who is part of course', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
			const course = courseEntityFactory.build({ school: studentUser.school, students: [studentUser] });
			await em.persist([studentAccount, studentUser, course]).flush();

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

			const cardNode = cardEntityFactory.withParent(columnNode).build();

			const submissionContainerNode = submissionContainerElementEntityFactory.withParent(cardNode).build();

			await em.persist([columnBoardNode, columnNode, cardNode, submissionContainerNode]).flush();
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount);

			return { loggedInClient, studentUser, columnBoardNode, columnNode, cardNode, submissionContainerNode };
		};

		it('should return status 201', async () => {
			const { loggedInClient, submissionContainerNode } = await setup();

			const response = await loggedInClient.post(`${submissionContainerNode.id}/submissions`, { completed: false });

			expect(response.status).toEqual(201);
		});

		it('should return created submission', async () => {
			const { loggedInClient, studentUser, submissionContainerNode } = await setup();

			const response = await loggedInClient.post(`${submissionContainerNode.id}/submissions`, { completed: true });

			const result = response.body as SubmissionItemResponse;
			expect(result.completed).toBe(true);
			expect(result.id).toBeDefined();
			expect(result.timestamps.createdAt).toBeDefined();
			expect(result.timestamps.lastUpdatedAt).toBeDefined();
			expect(result.userId).toBe(studentUser.id);
		});

		it('should actually create the submission item', async () => {
			const { loggedInClient, submissionContainerNode } = await setup();
			const response = await loggedInClient.post(`${submissionContainerNode.id}/submissions`, { completed: true });

			const submissionItemResponse = response.body as SubmissionItemResponse;

			const result = await em.findOneOrFail(BoardNodeEntity, submissionItemResponse.id);
			expect(result.id).toEqual(submissionItemResponse.id);
			expect(result.completed).toEqual(true);
		});

		it('should fail without params completed', async () => {
			const { loggedInClient, submissionContainerNode } = await setup();

			const response = await loggedInClient.post(`${submissionContainerNode.id}/submissions`, {});
			expect(response.status).toBe(400);
		});

		it('should fail when user wants to create more than one submission-item', async () => {
			const { loggedInClient, submissionContainerNode } = await setup();

			const response = await loggedInClient.post(`${submissionContainerNode.id}/submissions`, { completed: false });
			expect(response.status).toBe(201);

			const response2 = await loggedInClient.post(`${submissionContainerNode.id}/submissions`, { completed: false });
			expect(response2.status).toBe(403);
		});
	});

	describe('when user is an student who is not part of course', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
			const course = courseEntityFactory.build({ school: studentUser.school, students: [] });
			await em.persist([studentAccount, studentUser, course]).flush();

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

			const cardNode = cardEntityFactory.withParent(columnNode).build();

			const submissionContainerNode = submissionContainerElementEntityFactory.withParent(cardNode).build();

			await em.persist([columnBoardNode, columnNode, cardNode, submissionContainerNode]).flush();
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount);

			return { loggedInClient, studentUser, columnBoardNode, columnNode, cardNode, submissionContainerNode };
		};

		it('should return status 403', async () => {
			const { loggedInClient, submissionContainerNode } = await setup();

			const response = await loggedInClient.post(`${submissionContainerNode.id}/submissions`, { completed: false });

			expect(response.status).toEqual(403);
		});
	});

	describe('when with invalid user', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const user = userFactory.build();
			const course = courseEntityFactory.build({ teachers: [user] });

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

			await em.persist([user, teacherAccount, teacherUser, course]).flush();

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

			const cardNode = cardEntityFactory.withParent(columnNode).build();

			const submissionContainerNode = submissionContainerElementEntityFactory.withParent(cardNode).build();

			await em.persist([columnBoardNode, columnNode, cardNode, submissionContainerNode]).flush();
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, columnBoardNode, columnNode, cardNode, submissionContainerNode };
		};

		it('should return 403', async () => {
			const { loggedInClient, submissionContainerNode } = await setup();

			const invalidUser = userFactory.build();
			await em.persist([invalidUser]).flush();

			const response = await loggedInClient.post(`${submissionContainerNode.id}/submissions`, { completed: false });

			expect(response.status).toEqual(403);
		});
	});
});
