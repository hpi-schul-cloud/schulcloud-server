import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TextElementNode } from '@shared/domain';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	TestRequest,
	textElementNodeFactory,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { ServerTestModule } from '@src/modules/server/server.module';

describe(`content element update content (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let request: TestRequest;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		request = new TestRequest(app, 'elements');
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = async () => {
		await cleanupCollections(em);
		const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

		const columnBoardNode = columnBoardNodeFactory.buildWithId();
		const column = columnNodeFactory.buildWithId({ parent: columnBoardNode });
		const parentCard = cardNodeFactory.buildWithId({ parent: column });
		const element = textElementNodeFactory.buildWithId({ parent: parentCard });

		await em.persistAndFlush([studentAccount, studentUser, parentCard, column, columnBoardNode, element]);
		em.clear();

		return { studentAccount, parentCard, column, columnBoardNode, element };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { studentAccount, element } = await setup();

			const response = await request.put(
				`${element.id}/content`,
				{ content: { text: 'hello world' }, type: 'text' },
				studentAccount
			);

			expect(response.statusCode).toEqual(204);
		});

		it('should actually change content of the element', async () => {
			const { studentAccount, element } = await setup();

			await request.put(`${element.id}/content`, { content: { text: 'hello world' }, type: 'text' }, studentAccount);
			const result = await em.findOneOrFail(TextElementNode, element.id);

			expect(result.text).toEqual('hello world');
		});
	});

	// TODO: add tests for permission checks... during their implementation
});
