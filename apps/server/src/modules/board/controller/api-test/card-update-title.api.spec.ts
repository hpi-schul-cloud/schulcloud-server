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
import { cardEntityFactory, columnBoardEntityFactory, columnEntityFactory } from '../../testing';

const baseRouteName = '/cards';

describe(`card update title (api)`, () => {
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

			const course = courseEntityFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherUser, teacherAccount, course]);

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
			const cardNode = cardEntityFactory.withParent(columnNode).build();

			await em.persistAndFlush([cardNode, columnNode, columnBoardNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, cardNode };
		};

		it('should return status 204', async () => {
			const { loggedInClient, cardNode } = await setup();

			const newTitle = 'new title';

			const response = await loggedInClient.patch(`${cardNode.id}/title`, { title: newTitle });
			expect(response.statusCode).toEqual(204);
		});

		it('should actually change the card title', async () => {
			const { loggedInClient, cardNode } = await setup();

			const newTitle = 'new title';

			await loggedInClient.patch(`${cardNode.id}/title`, { title: newTitle });

			const result = await em.findOneOrFail(BoardNodeEntity, cardNode.id);

			expect(result.title).toEqual(newTitle);
		});

		it('should sanitize the title', async () => {
			const { loggedInClient, cardNode } = await setup();

			const unsanitizedTitle = '<iframe>foo</iframe> bar';
			const sanitizedTitle = 'foo bar';

			await loggedInClient.patch(`${cardNode.id}/title`, { title: unsanitizedTitle });
			const result = await em.findOneOrFail(BoardNodeEntity, cardNode.id);

			expect(result.title).toEqual(sanitizedTitle);
		});
	});

	describe('with non authorised user', () => {
		const setup = async () => {
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

			const course = courseEntityFactory.build({ students: [studentUser] });
			await em.persistAndFlush([studentUser, studentAccount, course]);

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

			const title = 'old title';
			const cardNode = cardEntityFactory.withParent(columnNode).build({ title });

			await em.persistAndFlush([cardNode, columnNode, columnBoardNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount);

			return { loggedInClient, cardNode, title };
		};

		it('should return status 403', async () => {
			const { loggedInClient, cardNode, title } = await setup();

			const newTitle = 'new title';

			const response = await loggedInClient.patch(`${cardNode.id}/title`, { title: newTitle });
			expect(response.statusCode).toEqual(403);

			const result = await em.findOneOrFail(BoardNodeEntity, cardNode.id);
			expect(result.title).toEqual(title);
		});
	});
});
