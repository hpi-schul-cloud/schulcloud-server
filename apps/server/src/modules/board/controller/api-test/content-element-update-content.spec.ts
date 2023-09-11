import { EntityManager } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { sanitizeRichText } from '@shared/controller';
import {
	BoardExternalReferenceType,
	ContentElementType,
	FileElementNode,
	InputFormat,
	RichTextElementNode,
} from '@shared/domain';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	fileElementNodeFactory,
	richTextElementNodeFactory,
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
			const richTextelement = richTextElementNodeFactory.buildWithId({ parent: parentCard });
			const fileElement = fileElementNodeFactory.buildWithId({ parent: parentCard });

			await em.persistAndFlush([
				teacherAccount,
				teacherUser,
				parentCard,
				column,
				columnBoardNode,
				richTextelement,
				fileElement,
			]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, richTextelement, fileElement };
		};

		it('should return status 204', async () => {
			const { loggedInClient, richTextelement } = await setup();

			const response = await loggedInClient.patch(`${richTextelement.id}/content`, {
				data: {
					content: { text: 'hello world', inputFormat: InputFormat.RICH_TEXT_CK5 },
					type: ContentElementType.RICH_TEXT,
				},
			});

			expect(response.statusCode).toEqual(204);
		});

		it('should actually change content of the element', async () => {
			const { loggedInClient, richTextelement } = await setup();

			await loggedInClient.patch(`${richTextelement.id}/content`, {
				data: {
					content: { text: 'hello world', inputFormat: InputFormat.RICH_TEXT_CK5 },
					type: ContentElementType.RICH_TEXT,
				},
			});
			const result = await em.findOneOrFail(RichTextElementNode, richTextelement.id);

			expect(result.text).toEqual('hello world');
		});

		it('should sanitize rich text before changing content of the element', async () => {
			const { loggedInClient, richTextelement } = await setup();

			const text = '<iframe>rich text 1</iframe> some more text';

			const sanitizedText = sanitizeRichText(text, InputFormat.RICH_TEXT_CK5);

			await loggedInClient.patch(`${richTextelement.id}/content`, {
				data: { content: { text, inputFormat: InputFormat.RICH_TEXT_CK5 }, type: ContentElementType.RICH_TEXT },
			});
			const result = await em.findOneOrFail(RichTextElementNode, richTextelement.id);

			expect(result.text).toEqual(sanitizedText);
		});

		it('should sanitize caption parameter before changing caption of the element', async () => {
			const { loggedInClient, fileElement } = await setup();

			const caption = '<iframe>rich text 1</iframe> some more text';

			await loggedInClient.patch(`${fileElement.id}/content`, {
				data: { content: { caption }, type: ContentElementType.FILE },
			});

			const result = await em.findOneOrFail(FileElementNode, fileElement.id);

			expect(result.caption).toEqual('rich text 1 some more text');
		});

		it('should sanitize alternativeText parameter before changing caption of the element', async () => {
			const { loggedInClient, fileElement } = await setup();

			const alternativeText = '<iframe>rich text 1</iframe> some more text';

			await loggedInClient.patch(`${fileElement.id}/content`, {
				data: { content: { caption: '', alternativeText }, type: ContentElementType.FILE },
			});
			const result = await em.findOneOrFail(FileElementNode, fileElement.id);

			expect(result.alternativeText).toEqual('rich text 1 some more text');
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

			const loggedInClient = await testApiClient.login(invalidTeacherAccount);

			return { loggedInClient, element };
		};

		it('should return status 403', async () => {
			const { loggedInClient, element } = await setup();

			const response = await loggedInClient.patch(`${element.id}/content`, {
				data: { content: { text: 'hello world', inputFormat: InputFormat.RICH_TEXT_CK5 }, type: 'richText' },
			});

			expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
		});
	});
});
