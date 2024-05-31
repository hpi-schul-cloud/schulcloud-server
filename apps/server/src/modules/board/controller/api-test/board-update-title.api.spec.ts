import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { TestApiClient, UserAndAccountTestFactory, cleanupCollections, courseFactory } from '@shared/testing';
import { BoardNodeEntity } from '../../repo';
import { columnBoardEntityFactory } from '../../testing';
import { BoardExternalReferenceType } from '../../domain';

const baseRouteName = '/boards';

describe(`board update title (api)`, () => {
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

			const columnBoardNode = columnBoardEntityFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			await em.persistAndFlush([teacherAccount, teacherUser, columnBoardNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, columnBoardNode };
		};

		it('should return status 204', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const newTitle = 'new title';

			const response = await loggedInClient.patch(`${columnBoardNode.id}/title`, { title: newTitle });

			expect(response.status).toEqual(204);
		});

		it('should actually change the board title', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const newTitle = 'new title';

			await loggedInClient.patch(`${columnBoardNode.id}/title`, { title: newTitle });

			const result = await em.findOneOrFail(BoardNodeEntity, columnBoardNode.id);

			expect(result.title).toEqual(newTitle);
		});

		it('should sanitize the title', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const unsanitizedTitle = '<iframe>foo</iframe> bar';
			const sanitizedTitle = 'foo bar';

			await loggedInClient.patch(`${columnBoardNode.id}/title`, { title: unsanitizedTitle });
			const result = await em.findOneOrFail(BoardNodeEntity, columnBoardNode.id);

			expect(result.title).toEqual(sanitizedTitle);
		});

		it('should return status 400 when title is too long', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const newTitle = 'a'.repeat(101);

			const response = await loggedInClient.patch(`${columnBoardNode.id}/title`, { title: newTitle });

			expect((response.body as ApiValidationError).validationErrors).toEqual([
				{
					errors: ['title must be shorter than or equal to 100 characters'],
					field: ['title'],
				},
			]);
			expect(response.status).toEqual(400);
		});

		it('should return status 400 when title is empty string', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const newTitle = '';

			const response = await loggedInClient.patch(`${columnBoardNode.id}/title`, { title: newTitle });

			expect((response.body as ApiValidationError).validationErrors).toEqual([
				{
					errors: ['title must be longer than or equal to 1 characters'],
					field: ['title'],
				},
			]);
			expect(response.status).toEqual(400);
		});
	});

	describe('with invalid user', () => {
		const setup = async () => {
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

			const course = courseFactory.build({ students: [studentUser] });
			await em.persistAndFlush([studentUser, course]);

			const title = 'old title';
			const columnBoardNode = columnBoardEntityFactory.buildWithId({
				title,
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			await em.persistAndFlush([studentAccount, studentUser, columnBoardNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount);

			return { loggedInClient, columnBoardNode, title };
		};

		it('should return status 403', async () => {
			const { loggedInClient, columnBoardNode, title } = await setup();

			const newTitle = 'new title';

			const response = await loggedInClient.patch(`${columnBoardNode.id}/title`, { title: newTitle });

			expect(response.status).toEqual(403);

			const result = await em.findOneOrFail(BoardNodeEntity, columnBoardNode.id);
			expect(result.title).toEqual(title);
		});
	});
});
