import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import {
	cardNodeFactory,
	cleanupCollections,
	collaborativeTextEditorNodeFactory,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { EtherpadClientAdapter } from '@src/infra/etherpad-client';
import { ServerTestModule } from '@src/modules/server';

describe('Collaborative Text Editor Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let etherpadClientAdapter: DeepMocked<EtherpadClientAdapter>;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(EtherpadClientAdapter)
			.useValue(createMock<EtherpadClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'collaborative-text-editor');
		etherpadClientAdapter = module.get(EtherpadClientAdapter);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('getCollaborativeTextEditorForParent', () => {
		describe('when request is invalid', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient };
			};

			describe('when no user is logged in', () => {
				it('should return 401', async () => {
					const someId = new ObjectId().toHexString();

					const response = await testApiClient.get(`content-element/${someId}}`);

					expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				});
			});

			describe('when id in params is not a mongo id', () => {
				it('should return 400', async () => {
					const { loggedInClient } = await setup();

					const response = await loggedInClient.get(`content-element/123`);

					expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
					expect(response.body).toEqual(
						expect.objectContaining({
							validationErrors: [{ errors: ['parentId must be a mongodb id'], field: ['parentId'] }],
						})
					);
				});
			});

			describe('when parentType in params is not correct', () => {
				it('should return 400', async () => {
					const { loggedInClient } = await setup();

					const someId = new ObjectId().toHexString();

					const response = await loggedInClient.get(`other-element/${someId}`);

					expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
					expect(response.body).toEqual(
						expect.objectContaining({
							validationErrors: [
								{ errors: ['parentType must be one of the following values: content-element'], field: ['parentType'] },
							],
						})
					);
				});
			});
		});

		describe('when request is valid', () => {
			describe('when no session for user exists', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
					const course = courseFactory.build({ students: [studentUser] });

					await em.persistAndFlush([studentUser, course]);

					const columnBoardNode = columnBoardNodeFactory.buildWithId({
						context: { id: course.id, type: BoardExternalReferenceType.Course },
					});
					const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
					const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });
					const collaborativeTextEditorElement = collaborativeTextEditorNodeFactory.build({ parent: cardNode });

					await em.persistAndFlush([
						studentAccount,
						collaborativeTextEditorElement,
						columnBoardNode,
						columnNode,
						cardNode,
					]);
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);

					const editorId = 'editorId';
					etherpadClientAdapter.getOrCreateEtherpadId.mockResolvedValueOnce(editorId);
					const otherSessionIds = [];
					etherpadClientAdapter.listSessionIdsOfAuthor.mockResolvedValueOnce(otherSessionIds);
					const sessionId = 'sessionId';
					etherpadClientAdapter.getOrCreateSessionId.mockResolvedValueOnce(sessionId);

					const basePath = Configuration.get('ETHERPAD__PAD_URI') as string;
					const expectedPath = `${basePath}/${editorId}`;

					const cookieExpiresMilliseconds = Number(Configuration.get('ETHERPAD__COOKIE_EXPIRES_SECONDS')) * 1000;
					// Remove the last 8 characters from the string to prevent conflict between time of test and code execution
					const sessionCookieExpiryDate = new Date(Date.now() + cookieExpiresMilliseconds).toUTCString().slice(0, -8);

					return {
						loggedInClient,
						collaborativeTextEditorElement,
						expectedPath,
						sessionId,
						sessionCookieExpiryDate,
						editorId,
					};
				};

				it('should return response and set cookie', async () => {
					const {
						loggedInClient,
						collaborativeTextEditorElement,
						expectedPath,
						sessionId,
						sessionCookieExpiryDate,
						editorId,
					} = await setup();

					const response = await loggedInClient.get(`content-element/${collaborativeTextEditorElement.id}`);

					expect(response.status).toEqual(HttpStatus.OK);
					// eslint-disable-next-line @typescript-eslint/dot-notation, @typescript-eslint/no-unsafe-member-access
					expect(response.body['url']).toEqual(expectedPath);
					// eslint-disable-next-line @typescript-eslint/dot-notation, @typescript-eslint/no-unsafe-member-access
					expect(response.headers['set-cookie'][0]).toContain(
						`sessionID=${sessionId}; Path=/p/${editorId}; Expires=${sessionCookieExpiryDate}`
					);
				});
			});

			describe('when other sessions for user already exists', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
					const course = courseFactory.build({ students: [studentUser] });

					await em.persistAndFlush([studentUser, course]);

					const columnBoardNode = columnBoardNodeFactory.buildWithId({
						context: { id: course.id, type: BoardExternalReferenceType.Course },
					});
					const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
					const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });
					const collaborativeTextEditorElement = collaborativeTextEditorNodeFactory.build({ parent: cardNode });

					await em.persistAndFlush([
						studentAccount,
						collaborativeTextEditorElement,
						columnBoardNode,
						columnNode,
						cardNode,
					]);
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);

					const editorId = 'editorId';
					etherpadClientAdapter.getOrCreateEtherpadId.mockResolvedValueOnce(editorId);
					const otherSessionIds = ['otherSessionId1', 'otherSessionId2'];
					etherpadClientAdapter.listSessionIdsOfAuthor.mockResolvedValueOnce(otherSessionIds);
					const sessionId = 'sessionId';
					etherpadClientAdapter.getOrCreateSessionId.mockResolvedValueOnce(sessionId);

					const basePath = Configuration.get('ETHERPAD__PAD_URI') as string;
					const expectedPath = `${basePath}/${editorId}`;

					const cookieExpiresMilliseconds = Number(Configuration.get('ETHERPAD__COOKIE_EXPIRES_SECONDS')) * 1000;
					// Remove the last 8 characters from the string to prevent conflict between time of test and code execution
					const sessionCookieExpiryDate = new Date(Date.now() + cookieExpiresMilliseconds).toUTCString().slice(0, -8);

					return {
						loggedInClient,
						collaborativeTextEditorElement,
						expectedPath,
						sessionId,
						sessionCookieExpiryDate,
						editorId,
					};
				};

				it('should return response and set cookie', async () => {
					const {
						loggedInClient,
						collaborativeTextEditorElement,
						expectedPath,
						sessionId,
						sessionCookieExpiryDate,
						editorId,
					} = await setup();

					const response = await loggedInClient.get(`content-element/${collaborativeTextEditorElement.id}`);

					expect(response.status).toEqual(HttpStatus.OK);
					// eslint-disable-next-line @typescript-eslint/dot-notation, @typescript-eslint/no-unsafe-member-access
					expect(response.body['url']).toEqual(expectedPath);
					// eslint-disable-next-line @typescript-eslint/dot-notation, @typescript-eslint/no-unsafe-member-access
					expect(response.headers['set-cookie'][0]).toContain(
						`sessionID=${sessionId}; Path=/p/${editorId}; Expires=${sessionCookieExpiryDate}`
					);
				});
			});

			describe('when session for user already exists', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
					const course = courseFactory.build({ students: [studentUser] });

					await em.persistAndFlush([studentUser, course]);

					const columnBoardNode = columnBoardNodeFactory.buildWithId({
						context: { id: course.id, type: BoardExternalReferenceType.Course },
					});
					const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
					const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });
					const collaborativeTextEditorElement = collaborativeTextEditorNodeFactory.build({ parent: cardNode });

					await em.persistAndFlush([
						studentAccount,
						collaborativeTextEditorElement,
						columnBoardNode,
						columnNode,
						cardNode,
					]);
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);

					const editorId = 'editorId';
					etherpadClientAdapter.getOrCreateEtherpadId.mockResolvedValueOnce(editorId);
					const sessionId = 'sessionId';
					const otherSessionIds = ['sessionId'];
					etherpadClientAdapter.listSessionIdsOfAuthor.mockResolvedValueOnce(otherSessionIds);
					etherpadClientAdapter.getOrCreateSessionId.mockResolvedValueOnce(sessionId);

					const basePath = Configuration.get('ETHERPAD__PAD_URI') as string;
					const expectedPath = `${basePath}/${editorId}`;

					const cookieExpiresMilliseconds = Number(Configuration.get('ETHERPAD_COOKIE__EXPIRES_SECONDS')) * 1000;
					// Remove the last 8 characters from the string to prevent conflict between time of test and code execution
					const sessionCookieExpiryDate = new Date(Date.now() + cookieExpiresMilliseconds).toUTCString().slice(0, -8);

					return {
						loggedInClient,
						collaborativeTextEditorElement,
						expectedPath,
						sessionId,
						sessionCookieExpiryDate,
						editorId,
					};
				};

				it('should return response and set cookie', async () => {
					const {
						loggedInClient,
						collaborativeTextEditorElement,
						expectedPath,
						sessionId,
						sessionCookieExpiryDate,
						editorId,
					} = await setup();

					const response = await loggedInClient.get(`content-element/${collaborativeTextEditorElement.id}`);

					expect(response.status).toEqual(HttpStatus.OK);
					// eslint-disable-next-line @typescript-eslint/dot-notation, @typescript-eslint/no-unsafe-member-access
					expect(response.body['url']).toEqual(expectedPath);
					// eslint-disable-next-line @typescript-eslint/dot-notation, @typescript-eslint/no-unsafe-member-access
					expect(response.headers['set-cookie'][0]).toContain(
						`sessionID=${sessionId}; Path=/p/${editorId}; Expires=${sessionCookieExpiryDate}`
					);
				});
			});
		});
	});
});
