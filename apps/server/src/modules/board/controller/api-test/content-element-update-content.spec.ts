import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { sanitizeRichText } from '@shared/controller';
import { InputFormat, RichTextElementNode } from '@shared/domain';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	richTextElementNodeFactory,
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
		const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

		const columnBoardNode = columnBoardNodeFactory.buildWithId();
		const column = columnNodeFactory.buildWithId({ parent: columnBoardNode });
		const parentCard = cardNodeFactory.buildWithId({ parent: column });
		const element = richTextElementNodeFactory.buildWithId({ parent: parentCard });

		await em.persistAndFlush([studentAccount, studentUser, parentCard, column, columnBoardNode, element]);
		em.clear();

		return { studentAccount, parentCard, column, columnBoardNode, element };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { studentAccount, element } = await setup();

			const response = await request.put(
				`${element.id}/content`,
				{ data: { content: { text: 'hello world', inputFormat: InputFormat.RICH_TEXT_CK5 }, type: 'richtext' } },
				studentAccount
			);

			expect(response.statusCode).toEqual(204);
		});

		it('should actually change content of the element', async () => {
			const { studentAccount, element } = await setup();

			await request.put(
				`${element.id}/content`,
				{ data: { content: { text: 'hello world', inputFormat: InputFormat.RICH_TEXT_CK5 }, type: 'richtext' } },
				studentAccount
			);
			const result = await em.findOneOrFail(RichTextElementNode, element.id);

			expect(result.text).toEqual('hello world');
		});

		it('should sanitize richtext before changing content of the element', async () => {
			const { studentAccount, element } = await setup();

			const text = '<iframe>rich text 1</iframe> some more text';

			const sanitizedText = sanitizeRichText(text, InputFormat.RICH_TEXT_CK5);

			await request.put(
				`${element.id}/content`,
				{ data: { content: { text, inputFormat: InputFormat.RICH_TEXT_CK5 }, type: 'richtext' } },
				studentAccount
			);
			const result = await em.findOneOrFail(RichTextElementNode, element.id);

			expect(result.text).toEqual(sanitizedText);
		});
	});

	// TODO: add tests for permission checks... during their implementation
});
