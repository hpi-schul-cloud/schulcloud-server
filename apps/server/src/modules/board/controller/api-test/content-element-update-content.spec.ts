import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { sanitizeRichText } from '@shared/controller';
import { InputFormat } from '@shared/domain/types';
import { cleanupCollections, courseFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { BoardNodeEntity } from '../../repo';
import { BoardExternalReferenceType, ContentElementType } from '../../domain';
import {
	cardEntityFactory,
	columnBoardEntityFactory,
	columnEntityFactory,
	fileElementEntityFactory,
	richTextElementEntityFactory,
	submissionContainerElementEntityFactory,
} from '../../testing';

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

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const column = columnEntityFactory.withParent(columnBoardNode).build();
			const parentCard = cardEntityFactory.withParent(column).build();
			const richTextElement = richTextElementEntityFactory.withParent(parentCard).build();
			const fileElement = fileElementEntityFactory.withParent(parentCard).build();
			const submissionContainerElement = submissionContainerElementEntityFactory.withParent(parentCard).build({
				dueDate: null,
			});

			const tomorrow = new Date(Date.now() + 86400000);
			const submissionContainerElementWithDueDate = submissionContainerElementEntityFactory
				.withParent(parentCard)
				.build({
					dueDate: tomorrow,
				});

			await em.persistAndFlush([
				teacherAccount,
				teacherUser,
				parentCard,
				column,
				columnBoardNode,
				richTextElement,
				fileElement,
				submissionContainerElement,
				submissionContainerElementWithDueDate,
			]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return {
				loggedInClient,
				richTextElement,
				fileElement,
				submissionContainerElement,
				submissionContainerElementWithDueDate,
			};
		};

		it('should return status 201', async () => {
			const { loggedInClient, richTextElement } = await setup();

			const response = await loggedInClient.patch(`${richTextElement.id}/content`, {
				data: {
					content: { text: 'hello world', inputFormat: InputFormat.RICH_TEXT_CK5 },
					type: ContentElementType.RICH_TEXT,
				},
			});

			expect(response.statusCode).toEqual(201);
		});

		it('should actually change content of the element', async () => {
			const { loggedInClient, richTextElement } = await setup();

			await loggedInClient.patch(`${richTextElement.id}/content`, {
				data: {
					content: { text: 'hello world', inputFormat: InputFormat.RICH_TEXT_CK5 },
					type: ContentElementType.RICH_TEXT,
				},
			});
			const result = await em.findOneOrFail(BoardNodeEntity, richTextElement.id);

			expect(result.text).toEqual('hello world');
		});

		it('should sanitize rich text before changing content of the element', async () => {
			const { loggedInClient, richTextElement } = await setup();

			const text = '<iframe>rich text 1</iframe> some more text';

			const sanitizedText = sanitizeRichText(text, InputFormat.RICH_TEXT_CK5);

			await loggedInClient.patch(`${richTextElement.id}/content`, {
				data: { content: { text, inputFormat: InputFormat.RICH_TEXT_CK5 }, type: ContentElementType.RICH_TEXT },
			});
			const result = await em.findOneOrFail(BoardNodeEntity, richTextElement.id);

			expect(result.text).toEqual(sanitizedText);
		});

		it('should sanitize caption parameter before changing caption of the element', async () => {
			const { loggedInClient, fileElement } = await setup();

			const caption = '<iframe>rich text 1</iframe> some more text';

			await loggedInClient.patch(`${fileElement.id}/content`, {
				data: { content: { caption, alternativeText: '' }, type: ContentElementType.FILE },
			});

			const result = await em.findOneOrFail(BoardNodeEntity, fileElement.id);

			expect(result.caption).toEqual('rich text 1 some more text');
		});

		it('should sanitize alternativeText parameter before changing caption of the element', async () => {
			const { loggedInClient, fileElement } = await setup();

			const alternativeText = '<iframe>rich text 1</iframe> some more text';

			await loggedInClient.patch(`${fileElement.id}/content`, {
				data: { content: { caption: '', alternativeText }, type: ContentElementType.FILE },
			});
			const result = await em.findOneOrFail(BoardNodeEntity, fileElement.id);

			expect(result.alternativeText).toEqual('rich text 1 some more text');
		});

		it('should return status 201', async () => {
			const { loggedInClient, submissionContainerElement } = await setup();
			const response = await loggedInClient.patch(`${submissionContainerElement.id}/content`, {
				data: {
					content: {},
					type: 'submissionContainer',
				},
			});

			expect(response.statusCode).toEqual(201);
		});

		it('should not change dueDate when not proviced in submission container element without dueDate', async () => {
			const { loggedInClient, submissionContainerElement } = await setup();

			await loggedInClient.patch(`${submissionContainerElement.id}/content`, {
				data: {
					content: {},
					type: 'submissionContainer',
				},
			});
			const result = await em.findOneOrFail(BoardNodeEntity, submissionContainerElement.id);
			expect(result.dueDate).toBeNull();
		});

		it('should set dueDate value when provided for submission container element', async () => {
			const { loggedInClient, submissionContainerElement } = await setup();

			const inThreeDays = new Date(Date.now() + 259200000);

			await loggedInClient.patch(`${submissionContainerElement.id}/content`, {
				data: {
					content: { dueDate: inThreeDays },
					type: 'submissionContainer',
				},
			});
			const result = await em.findOneOrFail(BoardNodeEntity, submissionContainerElement.id);

			expect(result.dueDate).toEqual(inThreeDays);
		});

		it('should unset dueDate value when dueDate parameter is null for submission container element', async () => {
			const { loggedInClient, submissionContainerElementWithDueDate } = await setup();

			await loggedInClient.patch(`${submissionContainerElementWithDueDate.id}/content`, {
				data: {
					content: {
						dueDate: null,
					},
					type: 'submissionContainer',
				},
			});
			const result = await em.findOneOrFail(BoardNodeEntity, submissionContainerElementWithDueDate.id);

			expect(result.dueDate).toBeNull();
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

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const column = columnEntityFactory.withParent(columnBoardNode).build();
			const parentCard = cardEntityFactory.withParent(column).build();
			const richTextElement = richTextElementEntityFactory.withParent(parentCard).build();
			const submissionContainerElement = submissionContainerElementEntityFactory.withParent(parentCard).build();

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
