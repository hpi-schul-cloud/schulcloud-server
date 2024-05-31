import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory, cleanupCollections, courseFactory } from '@shared/testing';
import { BoardNodeEntity } from '../../repo';
import {
	cardEntityFactory,
	columnBoardEntityFactory,
	columnEntityFactory,
	submissionContainerElementEntityFactory,
	submissionItemEntityFactory,
} from '../../testing';
import { BoardExternalReferenceType } from '../../domain';
import { SubmissionItemResponse } from '../dto';

const baseRouteName = '/board-submissions';
describe('submission item delete (api)', () => {
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

			const columnBoardNode = columnBoardEntityFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

			const cardNode = cardEntityFactory.withParent(columnNode).build();

			const submissionContainerNode = submissionContainerElementEntityFactory.withParent(cardNode).build();
			const submissionItemNode = submissionItemEntityFactory.withParent(submissionContainerNode).build({
				userId: 'foo',
				completed: true,
			});

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, submissionContainerNode, submissionItemNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, submissionItemNode };
		};
		it('should return status 403', async () => {
			const { loggedInClient, submissionItemNode } = await setup();

			const response = await loggedInClient.delete(`${submissionItemNode.id}`);

			expect(response.status).toEqual(403);
		});
		it('should not actually delete submission item entity', async () => {
			const { loggedInClient, submissionItemNode } = await setup();

			await loggedInClient.delete(`${submissionItemNode.id}`);

			const result = await em.findOneOrFail(BoardNodeEntity, submissionItemNode.id);
			expect(result.completed).toEqual(submissionItemNode.completed);
		});
	});

	describe('when user is a student trying to delete his own submission item', () => {
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

			const submissionContainerNode = submissionContainerElementEntityFactory.withParent(cardNode).build();

			const submissionItemNode = submissionItemEntityFactory.withParent(submissionContainerNode).build({
				userId: studentUser.id,
				completed: true,
			});

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, submissionContainerNode, submissionItemNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount);

			return { loggedInClient, studentUser, submissionItemNode };
		};
		it('should return status 204', async () => {
			const { loggedInClient, submissionItemNode } = await setup();

			const response = await loggedInClient.delete(`${submissionItemNode.id}`);

			expect(response.status).toEqual(204);
		});

		it('should actually delete the submission item', async () => {
			const { loggedInClient, submissionItemNode } = await setup();
			const response = await loggedInClient.delete(`${submissionItemNode.id}`);

			const submissionItemResponse = response.body as SubmissionItemResponse;

			await expect(em.findOneOrFail(BoardNodeEntity, submissionItemResponse.id)).rejects.toThrow();
		});
	});

	describe('when user is a student from same course, and tries to delete a submission item he did not create himself', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
			const { studentAccount: studentAccount2, studentUser: studentUser2 } = UserAndAccountTestFactory.buildStudent();
			const course = courseFactory.build({ students: [studentUser, studentUser2] });
			await em.persistAndFlush([studentAccount, studentUser, studentAccount2, studentUser2, course]);

			const columnBoardNode = columnBoardEntityFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

			const cardNode = cardEntityFactory.withParent(columnNode).build();

			const submissionContainerNode = submissionContainerElementEntityFactory.withParent(cardNode).build();

			const submissionItemNode = submissionItemEntityFactory.withParent(submissionContainerNode).build({
				userId: studentUser.id,
				completed: true,
			});
			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, submissionContainerNode, submissionItemNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount2);

			return { loggedInClient, submissionItemNode };
		};

		it('should return status 403', async () => {
			const { loggedInClient, submissionItemNode } = await setup();

			const response = await loggedInClient.delete(`${submissionItemNode.id}`);

			expect(response.status).toEqual(403);
		});
		it('should not actually delete submission item entity', async () => {
			const { loggedInClient, submissionItemNode } = await setup();

			await loggedInClient.delete(`${submissionItemNode.id}`);

			const result = await em.findOneOrFail(BoardNodeEntity, submissionItemNode.id);
			expect(result.completed).toEqual(submissionItemNode.completed);
		});
	});

	describe('when user is a student not in course', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
			const { studentAccount: studentAccount2, studentUser: studentUser2 } = UserAndAccountTestFactory.buildStudent();
			const course = courseFactory.build({ students: [studentUser] });
			await em.persistAndFlush([studentAccount, studentUser, studentAccount2, studentUser2, course]);

			const columnBoardNode = columnBoardEntityFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

			const cardNode = cardEntityFactory.withParent(columnNode).build();

			const submissionContainerNode = submissionContainerElementEntityFactory.withParent(cardNode).build();

			const submissionItemNode = submissionItemEntityFactory.withParent(submissionContainerNode).build({
				userId: studentUser.id,
				completed: true,
			});
			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, submissionContainerNode, submissionItemNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount2);

			return { loggedInClient, submissionItemNode };
		};

		it('should return status 403', async () => {
			const { loggedInClient, submissionItemNode } = await setup();

			const response = await loggedInClient.delete(`${submissionItemNode.id}`);

			expect(response.status).toEqual(403);
		});

		it('should not actually delete submission item entity', async () => {
			const { loggedInClient, submissionItemNode } = await setup();

			await loggedInClient.delete(`${submissionItemNode.id}`);

			const result = await em.findOneOrFail(BoardNodeEntity, submissionItemNode.id);
			expect(result.completed).toEqual(submissionItemNode.completed);
		});
	});
});
