import { EntityManager } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { sanitizeRichText } from '@shared/controller';
import {
	BoardExternalReferenceType,
	InputFormat,
	RichTextElementNode,
	SubmissionContainerElementNode,
} from '@shared/domain';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	richTextElementNodeFactory,
	submissionContainerElementNodeFactory,
	TestApiClient,
	UserAndAccountTestFactory,
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
			const richTextElement = richTextElementNodeFactory.buildWithId({ parent: parentCard });
			const submissionContainerElement = submissionContainerElementNodeFactory.buildWithId({ parent: parentCard });

			const tomorrow = new Date(Date.now() + 86400000);
			const submissionContainerElementWithDueDate = submissionContainerElementNodeFactory.buildWithId({
				parent: parentCard,
				dueDate: tomorrow,
			});

			await em.persistAndFlush([
				teacherAccount,
				teacherUser,
				parentCard,
				column,
				columnBoardNode,
				richTextElement,
				submissionContainerElement,
				submissionContainerElementWithDueDate,
			]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, richTextElement, submissionContainerElement, submissionContainerElementWithDueDate };
		};

		it('should return status 204 for rich text element', async () => {
			const { loggedInClient, richTextElement } = await setup();

			const response = await loggedInClient.patch(`${richTextElement.id}/content`, {
				data: { content: { text: 'hello world', inputFormat: InputFormat.RICH_TEXT_CK5 }, type: 'richText' },
			});

			expect(response.statusCode).toEqual(204);
		});

		it('should actually change content of the rich text element', async () => {
			const { loggedInClient, richTextElement } = await setup();

			await loggedInClient.patch(`${richTextElement.id}/content`, {
				data: { content: { text: 'hello world', inputFormat: InputFormat.RICH_TEXT_CK5 }, type: 'richText' },
			});
			const result = await em.findOneOrFail(RichTextElementNode, richTextElement.id);

			expect(result.text).toEqual('hello world');
		});

		it('should sanitize rich text before changing content of the rich text element', async () => {
			const { loggedInClient, richTextElement } = await setup();

			const text = '<iframe>rich text 1</iframe> some more text';

			const sanitizedText = sanitizeRichText(text, InputFormat.RICH_TEXT_CK5);

			await loggedInClient.patch(`${richTextElement.id}/content`, {
				data: { content: { text, inputFormat: InputFormat.RICH_TEXT_CK5 }, type: 'richText' },
			});
			const result = await em.findOneOrFail(RichTextElementNode, richTextElement.id);

			expect(result.text).toEqual(sanitizedText);
		});

		it('should return status 204 (nothing changed) without dueDate parameter for submission container element', async () => {
			const { loggedInClient, submissionContainerElement } = await setup();

			const response = await loggedInClient.patch(`${submissionContainerElement.id}/content`, {
				data: {
					content: {},
					type: 'submissionContainer',
				},
			});

			expect(response.statusCode).toEqual(204);
		});

		it('should not change dueDate value without dueDate parameter for submission container element', async () => {
			const { loggedInClient, submissionContainerElement } = await setup();

			await loggedInClient.patch(`${submissionContainerElement.id}/content`, {
				data: {
					content: {},
					type: 'submissionContainer',
				},
			});
			const result = await em.findOneOrFail(SubmissionContainerElementNode, submissionContainerElement.id);

			expect(result.dueDate).toBeUndefined();
		});

		it('should set dueDate value when dueDate parameter is provided for submission container element', async () => {
			const { loggedInClient, submissionContainerElement } = await setup();

			const inThreeDays = new Date(Date.now() + 259200000);

			await loggedInClient.patch(`${submissionContainerElement.id}/content`, {
				data: {
					content: { dueDate: inThreeDays },
					type: 'submissionContainer',
				},
			});
			const result = await em.findOneOrFail(SubmissionContainerElementNode, submissionContainerElement.id);

			expect(result.dueDate).toEqual(inThreeDays);
		});

		it('should unset dueDate value when dueDate parameter is not provided for submission container element', async () => {
			const { loggedInClient, submissionContainerElementWithDueDate } = await setup();

			await loggedInClient.patch(`${submissionContainerElementWithDueDate.id}/content`, {
				data: {
					content: {},
					type: 'submissionContainer',
				},
			});
			const result = await em.findOneOrFail(SubmissionContainerElementNode, submissionContainerElementWithDueDate.id);

			expect(result.dueDate).toBeUndefined();
		});

		it('should return status 400 for wrong date format for submission container element', async () => {
			const { loggedInClient, submissionContainerElement } = await setup();

			const response = await loggedInClient.patch(`${submissionContainerElement.id}/content`, {
				data: {
					content: { dueDate: 'hello world' },
					type: 'submissionContainer',
				},
			});

			expect(response.statusCode).toEqual(400);
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
			const richTextElement = richTextElementNodeFactory.buildWithId({ parent: parentCard });
			const submissionContainerElement = submissionContainerElementNodeFactory.buildWithId({ parent: parentCard });

			await em.persistAndFlush([parentCard, column, columnBoardNode, richTextElement, submissionContainerElement]);
			em.clear();

			const loggedInClient = await testApiClient.login(invalidTeacherAccount);

			return { loggedInClient, richTextElement, submissionContainerElement };
		};

		it('should return status 403 for rich text element', async () => {
			const { loggedInClient, richTextElement } = await setup();

			const response = await loggedInClient.patch(`${richTextElement.id}/content`, {
				data: { content: { text: 'hello world', inputFormat: InputFormat.RICH_TEXT_CK5 }, type: 'richText' },
			});

			expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
		});

		it('should return status 403 for submission container element', async () => {
			const { loggedInClient, submissionContainerElement } = await setup();

			const response = await loggedInClient.patch(`${submissionContainerElement.id}/content`, {
				data: {
					content: {},
					type: 'submissionContainer',
				},
			});

			expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
		});
	});
});
