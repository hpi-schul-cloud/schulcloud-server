import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType, TextElementNode } from '@shared/domain';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	TestApiClient,
	textElementNodeFactory,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { ServerTestModule } from '@src/modules/server/server.module';

describe(`content element update content (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let request: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		request = new TestApiClient(app, 'elements');
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = async () => {
		await cleanupCollections(em);
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

		return { teacherAccount, parentCard, column, columnBoardNode, element };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { teacherAccount, element } = await setup();

			const response = await request.put(
				`${element.id}/content`,
				{ data: { content: { text: 'hello world' }, type: 'text' } },
				teacherAccount
			);

			expect(response.statusCode).toEqual(204);
		});

		it('should actually change content of the element', async () => {
			const { teacherAccount, element } = await setup();

			await request.put(
				`${element.id}/content`,
				{ data: { content: { text: 'hello world' }, type: 'text' } },
				teacherAccount
			);
			const result = await em.findOneOrFail(TextElementNode, element.id);

			expect(result.text).toEqual('hello world');
		});
	});

	describe('with valid user', () => {
		it('should return status 403', async () => {
			const { element } = await setup();

			const { teacherAccount: invalidTeacherAccount } = UserAndAccountTestFactory.buildTeacher();

			const response = await request.put(
				`${element.id}/content`,
				{ data: { content: { text: 'hello world' }, type: 'text' } },
				invalidTeacherAccount
			);

			expect(response.statusCode).toEqual(401);
		});
	});
});
