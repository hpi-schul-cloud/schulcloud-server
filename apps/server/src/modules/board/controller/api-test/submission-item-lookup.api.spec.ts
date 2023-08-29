import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType } from '@shared/domain';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	submissionContainerElementNodeFactory,
	submissionItemNodeFactory,
	userFactory,
} from '@shared/testing';
import { ServerTestModule } from '@src/modules/server';
import { SubmissionItemResponse } from '../dto';

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

	describe('with teacher of two submission containers filled with submission items of 2 students', () => {
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

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });

			const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });

			const submissionContainerNode1 = submissionContainerElementNodeFactory.buildWithId({ parent: cardNode });
			const submissionContainerNode2 = submissionContainerElementNodeFactory.buildWithId({ parent: cardNode });
			const item11 = submissionItemNodeFactory.buildWithId({
				parent: submissionContainerNode1,
				userId: studentUser1.id,
			});
			const item12 = submissionItemNodeFactory.buildWithId({
				parent: submissionContainerNode1,
				userId: studentUser2.id,
			});
			const item21 = submissionItemNodeFactory.buildWithId({
				parent: submissionContainerNode2,
				userId: studentUser1.id,
			});
			const item22 = submissionItemNodeFactory.buildWithId({
				parent: submissionContainerNode2,
				userId: studentUser2.id,
			});

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
			const body = response.body as SubmissionItemResponse[];
			expect(body.length).toBe(2);
			expect(body.map((item) => item.id)).toContain(item11.id);
			expect(body.map((item) => item.id)).toContain(item12.id);
		});

		it('should return all items from container 2 as teacher', async () => {
			const { loggedInClient, submissionContainerNode2, item21, item22 } = await setup();

			const response = await loggedInClient.get(`${submissionContainerNode2.id}`);
			const body = response.body as SubmissionItemResponse[];
			expect(body.length).toBe(2);
			expect(body.map((item) => item.id)).toContain(item21.id);
			expect(body.map((item) => item.id)).toContain(item22.id);
		});
	});

	describe('with student of a submission container filled with 2 items', () => {
		const setup = async () => {
			await cleanupCollections(em);

			// const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const { studentAccount: studentAccount1, studentUser: studentUser1 } = UserAndAccountTestFactory.buildStudent();
			const { studentAccount: studentAccount2, studentUser: studentUser2 } = UserAndAccountTestFactory.buildStudent();
			const course = courseFactory.build({ teachers: [], students: [studentUser1, studentUser2] });
			await em.persistAndFlush([studentAccount1, studentUser1, studentAccount2, studentUser2, course]);

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });

			const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });

			const submissionContainerNode = submissionContainerElementNodeFactory.buildWithId({ parent: cardNode });
			const item1 = submissionItemNodeFactory.buildWithId({
				parent: submissionContainerNode,
				userId: studentUser1.id,
			});
			const item2 = submissionItemNodeFactory.buildWithId({
				parent: submissionContainerNode,
				userId: studentUser2.id,
			});

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

		it('should return only submission item of student 1', async () => {
			const { loggedInClient, submissionContainerNode, item1 } = await setup();

			const response = await loggedInClient.get(`${submissionContainerNode.id}`);
			const body = response.body as SubmissionItemResponse[];
			expect(body.length).toBe(1);
			expect(body[0].id).toBe(item1.id);
		});
	});

	describe('with invalid user', () => {
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

			const response = await loggedInClient.get(`${submissionContainerNode.id}`);

			expect(response.status).toEqual(403);
		});
	});
});
