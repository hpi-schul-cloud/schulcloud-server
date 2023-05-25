import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { sanitizeRichText } from '@shared/controller';
import { BoardExternalReferenceType, InputFormat, RichTextElementNode } from '@shared/domain';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	richTextElementNodeFactory,
	TestApiClient,
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

	describe('with valid user', () => {
		const setup = async () => {
			await cleanupCollections(em);
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

			const course = courseFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherUser, course]);

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const column = columnNodeFactory.buildWithId({ parent: columnBoardNode });
			const parentCard = cardNodeFactory.buildWithId({ parent: column });
			const element = richTextElementNodeFactory.buildWithId({ parent: parentCard });

			await em.persistAndFlush([
				studentAccount,
				studentUser,
				teacherAccount,
				teacherUser,
				parentCard,
				column,
				columnBoardNode,
				element,
			]);
			em.clear();

			return { studentAccount, teacherAccount, parentCard, column, columnBoardNode, element };
		};

		it('should return status 204', async () => {
			const { studentAccount, element } = await setup();

			const response = await request.put(
				`${element.id}/content`,
				{ data: { content: { text: 'hello world', inputFormat: InputFormat.RICH_TEXT_CK5 }, type: 'richText' } },
				studentAccount
			);

			expect(response.statusCode).toEqual(204);
		});

		it('should actually change content of the element', async () => {
			const { studentAccount, element } = await setup();

			await request.put(
				`${element.id}/content`,
				{ data: { content: { text: 'hello world', inputFormat: InputFormat.RICH_TEXT_CK5 }, type: 'richText' } },
				studentAccount
			);
			const result = await em.findOneOrFail(RichTextElementNode, element.id);

			expect(result.text).toEqual('hello world');
		});

		it('should sanitize rich text before changing content of the element', async () => {
			const { studentAccount, element } = await setup();

			const text = '<iframe>rich text 1</iframe> some more text';

			const sanitizedText = sanitizeRichText(text, InputFormat.RICH_TEXT_CK5);

			await request.put(
				`${element.id}/content`,
				{ data: { content: { text, inputFormat: InputFormat.RICH_TEXT_CK5 }, type: 'richText' } },
				studentAccount
			);
			const result = await em.findOneOrFail(RichTextElementNode, element.id);

			expect(result.text).toEqual(sanitizedText);
		});
	});

	describe('with invalid user', () => {
		const setup = async () => {
			await cleanupCollections(em);
			const { teacherUser: invalidTeacherUser, teacherAccount: invalidTeacherAccount } =
				UserAndAccountTestFactory.buildTeacher();

			const course = courseFactory.build({ teachers: [] });
			await em.persistAndFlush([invalidTeacherUser, invalidTeacherAccount, course]);

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const column = columnNodeFactory.buildWithId({ parent: columnBoardNode });
			const parentCard = cardNodeFactory.buildWithId({ parent: column });
			const element = richTextElementNodeFactory.buildWithId({ parent: parentCard });

			await em.persistAndFlush([parentCard, column, columnBoardNode, element]);
			em.clear();

			return { invalidTeacherAccount, invalidTeacherUser, parentCard, column, columnBoardNode, element };
		};

		it('should return status 403', async () => {
			const { invalidTeacherAccount, element } = await setup();

			const response = await request.put(
				`${element.id}/content`,
				{ data: { content: { text: 'hello world' }, type: 'text' } },
				invalidTeacherAccount
			);

			expect(response.statusCode).toEqual(403);
		});
	});
});
