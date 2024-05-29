import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ColumnNode } from '@shared/domain/entity';
import { TestApiClient, UserAndAccountTestFactory, cleanupCollections, courseFactory } from '@shared/testing';
import { columnBoardFactory, columnFactory } from '../../testing';
import { BoardExternalReferenceType } from '../../domain';

const baseRouteName = '/columns';

describe(`column update title (api)`, () => {
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
			await cleanupCollections(em);

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

			const course = courseFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherUser, course]);

			const columnBoardNode = columnBoardFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			const columnNode = columnFactory.buildWithId({ parent: columnBoardNode });

			await em.persistAndFlush([teacherAccount, teacherUser, columnNode, columnBoardNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, columnNode };
		};

		it('should return status 204', async () => {
			const { loggedInClient, columnNode } = await setup();
			const newTitle = 'new title';

			const response = await loggedInClient.patch(`${columnNode.id}/title`, { title: newTitle });

			expect(response.statusCode).toEqual(204);
		});

		it('should actually change the column title', async () => {
			const { loggedInClient, columnNode } = await setup();

			const newTitle = 'new title';

			await loggedInClient.patch(`${columnNode.id}/title`, { title: newTitle });

			const result = await em.findOneOrFail(ColumnNode, columnNode.id);

			expect(result.title).toEqual(newTitle);
		});

		it('should sanitize the title', async () => {
			const { loggedInClient, columnNode } = await setup();

			const unsanitizedTitle = '<iframe>foo</iframe> bar';
			const sanitizedTitle = 'foo bar';

			await loggedInClient.patch(`${columnNode.id}/title`, { title: unsanitizedTitle });
			const result = await em.findOneOrFail(ColumnNode, columnNode.id);

			expect(result.title).toEqual(sanitizedTitle);
		});
	});

	describe('with invalid user', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

			const course = courseFactory.build({ students: [studentUser] });
			await em.persistAndFlush([studentUser, course]);

			const columnBoardNode = columnBoardFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			const title = 'old title';
			const columnNode = columnFactory.buildWithId({ parent: columnBoardNode, title });

			await em.persistAndFlush([studentAccount, studentUser, columnNode, columnBoardNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount);

			return { loggedInClient, columnNode, title };
		};

		it('should return status 403', async () => {
			const { loggedInClient, columnNode, title } = await setup();

			const newTitle = 'new title';

			const response = await loggedInClient.patch(`${columnNode.id}/title`, { title: newTitle });

			expect(response.statusCode).toEqual(403);

			const result = await em.findOneOrFail(ColumnNode, columnNode.id);
			expect(result.title).toEqual(title);
		});
	});
});
