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
	userFactory,
} from '@shared/testing';
import { ServerTestModule } from '@src/modules/server';
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

	describe('with valid teacher user', () => {
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
		it('should return status 201', async () => {
			const { loggedInClient, submissionContainerNode } = await setup();

			const response = await loggedInClient.post(`${submissionContainerNode.id}/submissions`, { completed: false });

			expect(response.status).toEqual(201);
		});

		it('should return created submission', async () => {
			const { loggedInClient, teacherUser, submissionContainerNode } = await setup();

			const response = await loggedInClient.post(`${submissionContainerNode.id}/submissions`, { completed: true });

			const result = response.body as SubmissionItemResponse;
			expect(result.completed).toBe(true);
			expect(result.id).toBeDefined();
			expect(result.timestamps.createdAt).toBeDefined();
			expect(result.timestamps.lastUpdatedAt).toBeDefined();
			expect(result.userId).toBe(teacherUser.id);
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

	describe('with valid student user', () => {
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

		it('should return status 403', async () => {
			const { loggedInClient, submissionContainerNode } = await setup();

			const response = await loggedInClient.post(`${submissionContainerNode.id}/submissions`, { completed: false });

			expect(response.status).toEqual(403);
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

			const response = await loggedInClient.post(`${submissionContainerNode.id}/submissions`, { completed: false });

			expect(response.status).toEqual(403);
		});
	});
});
