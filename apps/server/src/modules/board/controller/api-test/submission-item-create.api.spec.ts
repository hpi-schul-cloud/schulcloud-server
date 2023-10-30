import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType } from '@shared/domain/domainobject/board/types/board-external-reference';
import { SubmissionItemNode } from '@shared/domain/entity/boardnode/submission-item-node.entity';
import { cleanupCollections } from '@shared/testing/cleanup-collections';
import { cardNodeFactory } from '@shared/testing/factory/boardnode/card-node.factory';
import { columnBoardNodeFactory } from '@shared/testing/factory/boardnode/column-board-node.factory';
import { columnNodeFactory } from '@shared/testing/factory/boardnode/column-node.factory';
import { submissionContainerElementNodeFactory } from '@shared/testing/factory/boardnode/submission-container-element-node.factory';
import { courseFactory } from '@shared/testing/factory/course.factory';
import { UserAndAccountTestFactory } from '@shared/testing/factory/user-and-account.test.factory';
import { userFactory } from '@shared/testing/factory/user.factory';
import { TestApiClient } from '@shared/testing/test-api-client';
import { ServerTestModule } from '@src/modules/server/server.module';
import { SubmissionItemResponse } from '../dto/submission-item/submission-item.response';

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

	describe('when user is a valid teacher', () => {
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

			const submissionContainerNode = submissionContainerElementNodeFactory.buildWithId({ parent: cardNode });

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, submissionContainerNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, teacherUser, columnBoardNode, columnNode, cardNode, submissionContainerNode };
		};
		it('should return status 403', async () => {
			const { loggedInClient, submissionContainerNode } = await setup();

			const response = await loggedInClient.post(`${submissionContainerNode.id}/submissions`, { completed: false });

			expect(response.status).toEqual(403);
		});
	});

	describe('when user is a student who is part of course', () => {
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

			const submissionContainerNode = submissionContainerElementNodeFactory.buildWithId({ parent: cardNode });

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, submissionContainerNode]);
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

			const result = await em.findOneOrFail(SubmissionItemNode, submissionItemResponse.id);
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
			expect(response2.status).toBe(406);
		});
	});

	describe('when user is an student who is not part of course', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
			const course = courseFactory.build({ students: [] });
			await em.persistAndFlush([studentAccount, studentUser, course]);

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });

			const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });

			const submissionContainerNode = submissionContainerElementNodeFactory.buildWithId({ parent: cardNode });

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, submissionContainerNode]);
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
			const course = courseFactory.build({ teachers: [user] });

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

			await em.persistAndFlush([user, teacherAccount, teacherUser, course]);

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });

			const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });

			const submissionContainerNode = submissionContainerElementNodeFactory.buildWithId({ parent: cardNode });

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, submissionContainerNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, columnBoardNode, columnNode, cardNode, submissionContainerNode };
		};
		it('should return 403', async () => {
			const { loggedInClient, submissionContainerNode } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);

			const response = await loggedInClient.post(`${submissionContainerNode.id}/submissions`, { completed: false });

			expect(response.status).toEqual(403);
		});
	});
});
