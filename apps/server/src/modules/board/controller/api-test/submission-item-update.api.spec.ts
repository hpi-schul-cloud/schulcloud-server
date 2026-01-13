import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { ServerTestModule } from '@modules/server';
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
	submissionItemEntityFactory,
} from '../../testing';
import { schoolEntityFactory } from '@modules/school/testing';

const baseRouteName = '/board-submissions';
describe('submission item update (api)', () => {
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
			const course = courseEntityFactory.build({ school: teacherUser.school, teachers: [teacherUser] });
			await em.persist([teacherAccount, teacherUser, course]).flush();

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

			const cardNode = cardEntityFactory.withParent(columnNode).build();

			const submissionContainerNode = submissionContainerElementEntityFactory.withParent(cardNode).build();
			const submissionItemNode = submissionItemEntityFactory.withParent(submissionContainerNode).build({
				userId: new ObjectId().toHexString(),
				completed: true,
			});

			await em.persist([columnBoardNode, columnNode, cardNode, submissionContainerNode, submissionItemNode]).flush();
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, submissionItemNode };
		};
		it('should return status 403', async () => {
			const { loggedInClient, submissionItemNode } = await setup();

			const response = await loggedInClient.patch(`${submissionItemNode.id}`, { completed: false });

			expect(response.status).toEqual(403);
		});
		it('should not actually update submission item entity', async () => {
			const { loggedInClient, submissionItemNode } = await setup();

			await loggedInClient.patch(`${submissionItemNode.id}`, { completed: false });

			const result = await em.findOneOrFail(BoardNodeEntity, submissionItemNode.id);
			expect(result.completed).toEqual(submissionItemNode.completed);
		});
	});

	describe('when user is a student trying to update his own submission item', () => {
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

			const submissionItemNode = submissionItemEntityFactory.withParent(submissionContainerNode).build({
				userId: studentUser.id,
				completed: true,
			});

			await em.persist([columnBoardNode, columnNode, cardNode, submissionContainerNode, submissionItemNode]).flush();
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount);

			return { loggedInClient, studentUser, submissionItemNode };
		};
		it('should return status 204', async () => {
			const { loggedInClient, submissionItemNode } = await setup();

			const response = await loggedInClient.patch(`${submissionItemNode.id}`, { completed: false });

			expect(response.status).toEqual(204);
		});

		it('should actually update the submission item', async () => {
			const { loggedInClient, submissionItemNode } = await setup();
			await loggedInClient.patch(`${submissionItemNode.id}`, { completed: false });

			const result = await em.findOneOrFail(BoardNodeEntity, submissionItemNode.id);
			expect(result.id).toEqual(submissionItemNode.id);
			expect(result.completed).toEqual(false);
		});

		it('should fail without params completed', async () => {
			const { loggedInClient, submissionItemNode } = await setup();

			const response = await loggedInClient.patch(`${submissionItemNode.id}`, {});
			expect(response.status).toBe(400);
		});
	});

	describe('when user is a student from same course, and tries to update a submission item he did not create himself', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const school = schoolEntityFactory.build();

			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
			const { studentAccount: studentAccount2, studentUser: studentUser2 } = UserAndAccountTestFactory.buildStudent({
				school,
			});
			const course = courseEntityFactory.build({ school, students: [studentUser, studentUser2] });
			await em.persist([studentAccount, studentUser, studentAccount2, studentUser2, course]).flush();

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

			const cardNode = cardEntityFactory.withParent(columnNode).build();

			const submissionContainerNode = submissionContainerElementEntityFactory.withParent(cardNode).build();

			const submissionItemNode = submissionItemEntityFactory.withParent(submissionContainerNode).build({
				userId: studentUser.id,
				completed: true,
			});
			await em.persist([columnBoardNode, columnNode, cardNode, submissionContainerNode, submissionItemNode]).flush();
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount2);

			return { loggedInClient, submissionItemNode };
		};

		it('should return status 403', async () => {
			const { loggedInClient, submissionItemNode } = await setup();

			const response = await loggedInClient.patch(`${submissionItemNode.id}`, { completed: false });

			expect(response.status).toEqual(403);
		});
		it('should not actually update submission item entity', async () => {
			const { loggedInClient, submissionItemNode } = await setup();

			await loggedInClient.patch(`${submissionItemNode.id}`, { completed: false });

			const result = await em.findOneOrFail(BoardNodeEntity, submissionItemNode.id);
			expect(result.completed).toEqual(submissionItemNode.completed);
		});
	});

	describe('when user is a student not in course', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const school = schoolEntityFactory.build();

			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
			const { studentAccount: studentAccount2, studentUser: studentUser2 } = UserAndAccountTestFactory.buildStudent({
				school,
			});
			const course = courseEntityFactory.build({ school, students: [studentUser] });
			await em.persist([studentAccount, studentUser, studentAccount2, studentUser2, course]).flush();

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

			const cardNode = cardEntityFactory.withParent(columnNode).build();

			const submissionContainerNode = submissionContainerElementEntityFactory.withParent(cardNode).build();

			const submissionItemNode = submissionItemEntityFactory.withParent(submissionContainerNode).build({
				userId: studentUser.id,
				completed: true,
			});
			await em.persist([columnBoardNode, columnNode, cardNode, submissionContainerNode, submissionItemNode]).flush();
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount2);

			return { loggedInClient, submissionItemNode };
		};

		it('should return status 403', async () => {
			const { loggedInClient, submissionItemNode } = await setup();

			const response = await loggedInClient.patch(`${submissionItemNode.id}`, { completed: false });

			expect(response.status).toEqual(403);
		});

		it('should not actually update submission item entity', async () => {
			const { loggedInClient, submissionItemNode } = await setup();

			await loggedInClient.patch(`${submissionItemNode.id}`, { completed: false });

			const result = await em.findOneOrFail(BoardNodeEntity, submissionItemNode.id);
			expect(result.completed).toEqual(submissionItemNode.completed);
		});
	});
});
