import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionItemNode } from '@shared/domain/entity';
import { TestApiClient, UserAndAccountTestFactory, cleanupCollections, courseFactory } from '@shared/testing';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	submissionContainerElementFactory,
	submissionItemFactory,
} from '../../testing';
import { BoardExternalReferenceType } from '../../domain';
import { SubmissionItemResponse } from '../dto';

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
			const course = courseFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherAccount, teacherUser, course]);

			const columnBoardNode = columnBoardFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnFactory.buildWithId({ parent: columnBoardNode });

			const cardNode = cardFactory.buildWithId({ parent: columnNode });

			const submissionContainerNode = submissionContainerElementFactory.buildWithId({ parent: cardNode });
			const submissionItemNode = submissionItemFactory.buildWithId({
				userId: 'foo',
				parent: submissionContainerNode,
				completed: true,
			});

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, submissionContainerNode, submissionItemNode]);
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

			const result = await em.findOneOrFail(SubmissionItemNode, submissionItemNode.id);
			expect(result.completed).toEqual(submissionItemNode.completed);
		});
	});

	describe('when user is a student trying to update his own submission item', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
			const course = courseFactory.build({ students: [studentUser] });
			await em.persistAndFlush([studentAccount, studentUser, course]);

			const columnBoardNode = columnBoardFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnFactory.buildWithId({ parent: columnBoardNode });

			const cardNode = cardFactory.buildWithId({ parent: columnNode });

			const submissionContainerNode = submissionContainerElementFactory.buildWithId({ parent: cardNode });

			const submissionItemNode = submissionItemFactory.buildWithId({
				userId: studentUser.id,
				parent: submissionContainerNode,
				completed: true,
			});

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, submissionContainerNode, submissionItemNode]);
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
			const response = await loggedInClient.patch(`${submissionItemNode.id}`, { completed: false });

			const submissionItemResponse = response.body as SubmissionItemResponse;

			const result = await em.findOneOrFail(SubmissionItemNode, submissionItemResponse.id);
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

			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
			const { studentAccount: studentAccount2, studentUser: studentUser2 } = UserAndAccountTestFactory.buildStudent();
			const course = courseFactory.build({ students: [studentUser, studentUser2] });
			await em.persistAndFlush([studentAccount, studentUser, studentAccount2, studentUser2, course]);

			const columnBoardNode = columnBoardFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnFactory.buildWithId({ parent: columnBoardNode });

			const cardNode = cardFactory.buildWithId({ parent: columnNode });

			const submissionContainerNode = submissionContainerElementFactory.buildWithId({ parent: cardNode });

			const submissionItemNode = submissionItemFactory.buildWithId({
				userId: studentUser.id,
				parent: submissionContainerNode,
				completed: true,
			});
			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, submissionContainerNode, submissionItemNode]);
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

			const result = await em.findOneOrFail(SubmissionItemNode, submissionItemNode.id);
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

			const columnBoardNode = columnBoardFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnFactory.buildWithId({ parent: columnBoardNode });

			const cardNode = cardFactory.buildWithId({ parent: columnNode });

			const submissionContainerNode = submissionContainerElementFactory.buildWithId({ parent: cardNode });

			const submissionItemNode = submissionItemFactory.buildWithId({
				userId: studentUser.id,
				parent: submissionContainerNode,
				completed: true,
			});
			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, submissionContainerNode, submissionItemNode]);
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

			const result = await em.findOneOrFail(SubmissionItemNode, submissionItemNode.id);
			expect(result.completed).toEqual(submissionItemNode.completed);
		});
	});
});
