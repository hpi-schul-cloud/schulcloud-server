import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { type ServerConfig, serverConfig, ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import {
	type DatesToStrings,
	mediaBoardNodeFactory,
	mediaExternalToolElementNodeFactory,
	mediaLineNodeFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { type MediaBoardResponse, MediaLineResponse } from '../dto';

const baseRouteName = '/media-boards';

describe('Media Board (API)', () => {
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

	describe('[GET] /media-boards/me', () => {
		describe('when a valid user accesses their media board', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardNodeFactory.buildWithId({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineNodeFactory.buildWithId({ parent: mediaBoard });
				const mediaElement = mediaExternalToolElementNodeFactory.buildWithId({ parent: mediaLine });

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard, mediaLine, mediaElement]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
					mediaLine,
					mediaElement,
				};
			};

			it('should return the media board of the user', async () => {
				const { studentClient, mediaBoard, mediaLine, mediaElement } = await setup();

				const response = await studentClient.get('me');

				expect(response.body).toEqual<DatesToStrings<MediaBoardResponse>>({
					id: mediaBoard.id,
					timestamps: {
						createdAt: mediaBoard.createdAt.toISOString(),
						lastUpdatedAt: mediaBoard.updatedAt.toISOString(),
					},
					lines: [
						{
							id: mediaLine.id,
							timestamps: {
								createdAt: mediaLine.createdAt.toISOString(),
								lastUpdatedAt: mediaLine.updatedAt.toISOString(),
							},
							title: mediaLine.title,
							elements: [
								{
									id: mediaElement.id,
									timestamps: {
										createdAt: mediaElement.createdAt.toISOString(),
										lastUpdatedAt: mediaElement.updatedAt.toISOString(),
									},
									content: {
										contextExternalToolId: mediaElement.contextExternalTool.id,
									},
								},
							],
						},
					],
				});
			});
		});

		describe('when the media board feature is disabled', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
				};
			};

			it('should return forbidden', async () => {
				const { studentClient } = await setup();

				const response = await studentClient.get('me');

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual({
					code: HttpStatus.FORBIDDEN,
					message: 'Forbidden',
					title: 'Feature Disabled',
					type: 'FEATURE_DISABLED',
				});
			});
		});

		describe('when the user is invalid', () => {
			const setup = () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;
			};

			it('should return unauthorized', async () => {
				setup();

				const response = await testApiClient.get('me');

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
					title: 'Unauthorized',
					type: 'UNAUTHORIZED',
				});
			});
		});
	});

	describe('[POST] /media-boards/:boardId/media-lines', () => {
		describe('when a valid user creates a line on their media board', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardNodeFactory.buildWithId({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
				};
			};

			it('should return the created line', async () => {
				const { studentClient, mediaBoard } = await setup();

				const response = await studentClient.post(`${mediaBoard.id}/media-lines`);

				expect(response.body).toEqual<DatesToStrings<MediaLineResponse>>({
					id: expect.any(String),
					timestamps: {
						createdAt: expect.any(String),
						lastUpdatedAt: expect.any(String),
					},
					elements: [],
					title: '',
				});
			});
		});

		describe('when the media board feature is disabled', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const mediaBoard = mediaBoardNodeFactory.buildWithId({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
				};
			};

			it('should return forbidden', async () => {
				const { studentClient, mediaBoard } = await setup();

				const response = await studentClient.post(`${mediaBoard.id}/media-lines`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual({
					code: HttpStatus.FORBIDDEN,
					message: 'Forbidden',
					title: 'Feature Disabled',
					type: 'FEATURE_DISABLED',
				});
			});
		});

		describe('when the user is invalid', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const mediaBoard = mediaBoardNodeFactory.buildWithId({
					context: {
						id: new ObjectId().toHexString(),
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persistAndFlush([mediaBoard]);
				em.clear();

				return {
					mediaBoard,
				};
			};

			it('should return unauthorized', async () => {
				const { mediaBoard } = await setup();

				const response = await testApiClient.post(`${mediaBoard.id}/media-lines`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
					title: 'Unauthorized',
					type: 'UNAUTHORIZED',
				});
			});
		});
	});
});
