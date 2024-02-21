import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { CardNode } from '@shared/domain/entity';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';

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
			await cleanupCollections(em);

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

			const course = courseFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherUser, course]);

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
			const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });

			await em.persistAndFlush([teacherAccount, teacherUser, cardNode, columnNode, columnBoardNode]);
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

			const result = await em.findOneOrFail(CardNode, cardNode.id);

			expect(result.title).toEqual(newTitle);
		});

		it('should sanitize the title', async () => {
			const { loggedInClient, cardNode } = await setup();

			const unsanitizedTitle = '<iframe>foo</iframe> bar';
			const sanitizedTitle = 'foo bar';

			await loggedInClient.patch(`${cardNode.id}/title`, { title: unsanitizedTitle });
			const result = await em.findOneOrFail(CardNode, cardNode.id);

			expect(result.title).toEqual(sanitizedTitle);
		});
	});

	describe('with non authorised user', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

			const course = courseFactory.build({ students: [studentUser] });
			await em.persistAndFlush([studentUser, course]);

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });

			const title = 'old title';
			const cardNode = cardNodeFactory.buildWithId({ parent: columnNode, title });

			await em.persistAndFlush([studentAccount, studentUser, cardNode, columnNode, columnBoardNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount);

			return { loggedInClient, cardNode, title };
		};

		it('should return status 403', async () => {
			const { loggedInClient, cardNode, title } = await setup();

			const newTitle = 'new title';

			const response = await loggedInClient.patch(`${cardNode.id}/title`, { title: newTitle });
			expect(response.statusCode).toEqual(403);

			const result = await em.findOneOrFail(CardNode, cardNode.id);
			expect(result.title).toEqual(title);
		});
	});
});
