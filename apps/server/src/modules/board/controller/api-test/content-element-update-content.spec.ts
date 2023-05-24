import { EntityManager } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType, TextElementNode } from '@shared/domain';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	textElementNodeFactory,
} from '@shared/testing';
import { ServerTestModule } from '@src/modules/server/server.module';

describe(`content element update content (api)`, () => {
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
		testApiClient = new TestApiClient(app, 'elements');
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

			const column = columnNodeFactory.buildWithId({ parent: columnBoardNode });
			const parentCard = cardNodeFactory.buildWithId({ parent: column });
			const element = textElementNodeFactory.buildWithId({ parent: parentCard });

			await em.persistAndFlush([teacherAccount, teacherUser, parentCard, column, columnBoardNode, element]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, element };
		};

		it('should return status 204', async () => {
			const { loggedInClient, element } = await setup();

			const response = await loggedInClient
				.put(`${element.id}/content`, {
					data: { content: { text: 'hello world' }, type: 'text' },
				})
				.set('myheader', 'foo')
				.query({ foo: 'bar' });

			expect(response.statusCode).toEqual(204);
		});

		it('should actually change content of the element', async () => {
			const { loggedInClient, element } = await setup();

			await loggedInClient.put(`${element.id}/content`, { data: { content: { text: 'hello world' }, type: 'text' } });
			const result = await em.findOneOrFail(TextElementNode, element.id);

			expect(result.text).toEqual('hello world');
		});
	});

	describe('with invalid user', () => {
		const setup = async () => {
			const { teacherUser: invalidTeacherUser, teacherAccount: invalidTeacherAccount } =
				UserAndAccountTestFactory.buildTeacher();

			const course = courseFactory.build({ teachers: [] });
			await em.persistAndFlush([invalidTeacherUser, invalidTeacherAccount, course]);

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const column = columnNodeFactory.buildWithId({ parent: columnBoardNode });
			const parentCard = cardNodeFactory.buildWithId({ parent: column });
			const element = textElementNodeFactory.buildWithId({ parent: parentCard });

			await em.persistAndFlush([parentCard, column, columnBoardNode, element]);
			em.clear();

			const loggedInClient = await testApiClient.login(invalidTeacherAccount);

			return { loggedInClient, element };
		};

		it('should return status 403', async () => {
			const { loggedInClient, element } = await setup();

			const response = await loggedInClient.put(`${element.id}/content`, {
				data: { content: { text: 'hello world' }, type: 'text' },
			});

			expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
		});
	});
});
