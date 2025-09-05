import { EntityManager } from '@mikro-orm/mongodb';
import { CopyApiResponse, CopyElementType, CopyStatusEnum } from '@modules/copy-helper';
import { courseEntityFactory } from '@modules/course/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType, BoardNodeType, ColumnBoardProps } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import {
	cardEntityFactory,
	columnBoardEntityFactory,
	columnEntityFactory,
	linkElementEntityFactory,
} from '../../testing';

const baseRouteName = '/boards';

describe(`board copy with course relation (api)`, () => {
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
		const setup = async (columnBoardProps: Partial<ColumnBoardProps> = {}) => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

			const course = courseEntityFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherAccount, teacherUser, course]);

			const columnBoardNode = columnBoardEntityFactory.build({
				...columnBoardProps,
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			await em.persistAndFlush([columnBoardNode]);
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
				destinationId: columnBoardNode.context?.id,
			};

			expect(body).toEqual(expectedBody);

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const result = await em.findOneOrFail(BoardNodeEntity, body.id!);

			expect(result).toBeDefined();
		});

		it('should set draft status on the board copy', async () => {
			const { loggedInClient, columnBoardNode } = await setup({ isVisible: true });

			const response = await loggedInClient.post(`${columnBoardNode.id}/copy`);
			const body = response.body as CopyApiResponse;

			const expectedBody: CopyApiResponse = {
				id: expect.any(String),
				type: CopyElementType.COLUMNBOARD,
				status: CopyStatusEnum.SUCCESS,
				destinationId: columnBoardNode.context?.id,
			};

			expect(body).toEqual(expectedBody);

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const result = await em.findOneOrFail(BoardNodeEntity, body.id!);

			expect(result.isVisible).toBe(false);
		});

		describe('when board contains link elements', () => {
			const setupWithLinkElement = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const course = courseEntityFactory.build({ teachers: [teacherUser] });
				await em.persistAndFlush([teacherAccount, teacherUser, course]);

				const columnBoardNode = columnBoardEntityFactory.build({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});
				const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
				const cardNode = cardEntityFactory.withParent(columnNode).build();
				const internalLinkElement = linkElementEntityFactory.withParent(cardNode).build({
					url: `https://example.com/boards/${columnBoardNode.id}#card-${cardNode.id}`,
					imageUrl: '',
				});
				await em.persistAndFlush([columnBoardNode, columnNode, cardNode, internalLinkElement]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, columnBoardNode };
			};

			it('should update internal links on the board copy', async () => {
				const { loggedInClient, columnBoardNode } = await setupWithLinkElement();

				const response = await loggedInClient.post(`${columnBoardNode.id}/copy`);
				const body = response.body as CopyApiResponse;
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const copyId = body.id!;

				const result = await em.find(BoardNodeEntity, {
					path: { $re: `^https://example.com/boards/${copyId}` },
					type: BoardNodeType.LINK_ELEMENT,
				});

				expect(result).toBeDefined();
			});
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

			const course = courseEntityFactory.build({ students: [studentUser] });
			await em.persistAndFlush([studentUser, course]);

			const columnBoardNode = columnBoardEntityFactory.build({
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
