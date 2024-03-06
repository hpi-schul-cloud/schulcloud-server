import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { ColumnBoardNode } from '@shared/domain/entity';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	courseFactory,
} from '@shared/testing';
import { CopyApiResponse, CopyElementType, CopyStatusEnum } from '@src/modules/copy-helper';

const baseRouteName = '/boards';

describe(`board copy (api)`, () => {
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

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	describe('with valid user', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

			const course = courseFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherUser, course]);

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			await em.persistAndFlush([teacherAccount, teacherUser, columnBoardNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, columnBoardNode };
		};

		it('should return status 201', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const response = await loggedInClient.post(`${columnBoardNode.id}/copy`);

			expect(response.status).toEqual(201);
		});

		it('should actually copy the board', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const response = await loggedInClient.post(`${columnBoardNode.id}/copy`);
			const body = response.body as CopyApiResponse;

			const expectedBody: CopyApiResponse = {
				id: expect.any(String),
				type: CopyElementType.COLUMNBOARD,
				status: CopyStatusEnum.SUCCESS,
			};

			expect(body).toEqual(expectedBody);

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const result = await em.findOneOrFail(ColumnBoardNode, body.id!);

			expect(result).toBeDefined();
		});

		describe('with invalid id', () => {
			it('should return status 400', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.post(`invalid-id/copy`);

				expect(response.status).toEqual(400);
			});
		});

		describe('with unknown id', () => {
			it('should return status 404', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.post(`65e84684e43ba80204598425/copy`);

				expect(response.status).toEqual(404);
			});
		});
	});

	describe('with invalid user', () => {
		const setup = async () => {
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

			const course = courseFactory.build({ students: [studentUser] });
			await em.persistAndFlush([studentUser, course]);

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			await em.persistAndFlush([studentAccount, studentUser, columnBoardNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount);

			return { loggedInClient, columnBoardNode };
		};

		it('should return status 403', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const response = await loggedInClient.post(`${columnBoardNode.id}/copy`);

			expect(response.status).toEqual(403);
		});
	});
});
