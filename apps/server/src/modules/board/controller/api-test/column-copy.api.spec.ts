import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import { columnBoardEntityFactory, columnEntityFactory } from '../../testing';
import { ColumnResponse } from '../dto';

const baseRouteName = '/columns';

describe(`column move (api)`, () => {
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

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = async () => {
		const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

		const course = courseEntityFactory.build({ school: teacherUser.school, teachers: [teacherUser] });
		await em.persist([teacherUser, teacherAccount, course]).flush();

		const columnBoardNode = columnBoardEntityFactory.build({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const columnNode1 = columnEntityFactory.withParent(columnBoardNode).build();
		const columnNode2 = columnEntityFactory.withParent(columnBoardNode).build();

		await em.persist([columnNode1, columnNode2, columnBoardNode]).flush();
		em.clear();

		const loggedInClient = await testApiClient.login(teacherAccount);

		return { loggedInClient, columnNode1, columnNode2, columnBoardNode };
	};

	describe('with valid user', () => {
		it('should return status 201', async () => {
			const { loggedInClient, columnNode1 } = await setup();

			const response = await loggedInClient.post(`${columnNode1.id}/copy`);

			expect(response.status).toEqual(201);
		});

		it('should return copied column response', async () => {
			const { loggedInClient, columnNode1 } = await setup();

			const response = await loggedInClient.post(`${columnNode1.id}/copy`);
			const copiedColumn = response.body as ColumnResponse;

			expect(copiedColumn.id).toBeDefined();
			expect(copiedColumn.title).toEqual(columnNode1.title);
		});

		it('should actually copy the column in the same board', async () => {
			const { loggedInClient, columnNode1 } = await setup();

			const response = await loggedInClient.post(`${columnNode1.id}/copy`);
			const copiedColumn = response.body as ColumnResponse;
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion

			const result = await em.findOneOrFail(BoardNodeEntity, copiedColumn.id);

			expect(result.path).toEqual(columnNode1.path);
		});

		it('should place the column under the original', async () => {
			const { loggedInClient, columnNode1, columnNode2 } = await setup();

			const response = await loggedInClient.post(`${columnNode1.id}/copy`);
			const copiedColumn = response.body as ColumnResponse;
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion

			const resultCopiedColumn = await em.findOneOrFail(BoardNodeEntity, copiedColumn.id);
			const resultColumn1 = await em.findOneOrFail(BoardNodeEntity, columnNode1.id);
			const resultColumn2 = await em.findOneOrFail(BoardNodeEntity, columnNode2.id);

			expect(resultColumn1.position).toEqual(columnNode1.position);
			expect(resultCopiedColumn.position).toEqual(columnNode1.position + 1);
			expect(resultColumn2.position).not.toEqual(columnNode2.position);
			expect(resultColumn2.position).toEqual(resultCopiedColumn.position + 1);
		});
	});

	describe('with invalid user', () => {
		const setupNoAccess = async () => {
			const vars = await setup();

			const { studentAccount: noAccessAccount, studentUser: noAccessUser } = UserAndAccountTestFactory.buildStudent();
			await em.persist([noAccessAccount, noAccessUser]).flush();
			const loggedInClient = await testApiClient.login(noAccessAccount);

			return {
				...vars,
				loggedInClient,
			};
		};

		it('should return status 403', async () => {
			const { loggedInClient, columnNode1 } = await setupNoAccess();

			const response = await loggedInClient.post(`${columnNode1.id}/copy`);

			expect(response.status).toEqual(403);
		});
	});
});
