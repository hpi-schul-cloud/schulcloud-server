import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { serverConfig, ServerTestModule, type ServerConfig } from '@modules/server';
import { contextExternalToolEntityFactory } from '@modules/tool/context-external-tool/testing';
import { externalToolEntityFactory } from '@modules/tool/external-tool/testing';
import { schoolExternalToolEntityFactory } from '@modules/tool/school-external-tool/testing';
import { MediaUserLicenseEntity } from '@modules/user-license/entity';
import { mediaUserLicenseEntityFactory } from '@modules/user-license/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory, type DatesToStrings } from '@shared/testing';
import { BoardExternalReferenceType, BoardLayout, MediaBoardColors } from '../../../domain';
import { BoardNodeEntity } from '../../../repo';
import {
	mediaBoardEntityFactory,
	mediaExternalToolElementEntityFactory,
	mediaLineEntityFactory,
} from '../../../testing';
import {
	CollapsableBodyParams,
	ColorBodyParams,
	LayoutBodyParams,
	MediaAvailableLineResponse,
	MediaLineResponse,
	type MediaBoardResponse,
} from '../dto';

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

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build();
				const contextExternalToolId = new ObjectId().toHexString();
				const mediaElement = mediaExternalToolElementEntityFactory
					.withParent(mediaLine)
					.build({ contextExternalToolId });

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard, mediaLine, mediaElement]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
					mediaLine,
					mediaElement,
					contextExternalToolId,
				};
			};

			it('should return the media board of the user', async () => {
				const { studentClient, mediaBoard, mediaLine, mediaElement, contextExternalToolId } = await setup();

				const response = await studentClient.get('me');

				expect(response.body).toEqual<DatesToStrings<MediaBoardResponse>>({
					id: mediaBoard.id,
					timestamps: {
						createdAt: mediaBoard.createdAt.toISOString(),
						lastUpdatedAt: mediaBoard.updatedAt.toISOString(),
					},
					layout: BoardLayout.LIST,
					lines: [
						{
							id: mediaLine.id,
							timestamps: {
								createdAt: mediaLine.createdAt.toISOString(),
								lastUpdatedAt: mediaLine.updatedAt.toISOString(),
							},
							collapsed: false,
							backgroundColor: MediaBoardColors.TRANSPARENT,
							title: mediaLine.title as string,
							elements: [
								{
									id: mediaElement.id,
									timestamps: {
										createdAt: mediaElement.createdAt.toISOString(),
										lastUpdatedAt: mediaElement.updatedAt.toISOString(),
									},
									content: {
										contextExternalToolId,
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

				const mediaBoard = mediaBoardEntityFactory.build({
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
					collapsed: false,
					backgroundColor: MediaBoardColors.TRANSPARENT,
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
				const mediaBoard = mediaBoardEntityFactory.build({
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

				const mediaBoard = mediaBoardEntityFactory.build({
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

	describe('[GET] /media-board/:boardId/media-available-line', () => {
		describe('when a valid user requests their available media line', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const externalTool = externalToolEntityFactory.build();
				const unusedExternalTool = externalToolEntityFactory.build();
				const schoolExternalTool = schoolExternalToolEntityFactory.build({
					tool: externalTool,
					school: studentUser.school,
				});
				const unusedSchoolExternalTool = schoolExternalToolEntityFactory.build({
					tool: unusedExternalTool,
					school: studentUser.school,
				});
				const contextExternalTool = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalTool,
				});

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
					backgroundColor: MediaBoardColors.RED,
					collapsed: true,
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build();
				const mediaElement = mediaExternalToolElementEntityFactory
					.withParent(mediaLine)
					.build({ contextExternalToolId: contextExternalTool.id });

				await em.persistAndFlush([
					studentAccount,
					studentUser,
					externalTool,
					unusedExternalTool,
					schoolExternalTool,
					unusedSchoolExternalTool,
					contextExternalTool,
					mediaBoard,
					mediaLine,
					mediaElement,
				]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
					unusedExternalTool,
					unusedSchoolExternalTool,
				};
			};

			it('should return the available media line', async () => {
				const { studentClient, mediaBoard, unusedExternalTool, unusedSchoolExternalTool } = await setup();

				const response = await studentClient.get(`${mediaBoard.id}/media-available-line`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<MediaAvailableLineResponse>({
					elements: [
						{
							schoolExternalToolId: unusedSchoolExternalTool.id,
							name: unusedExternalTool.name,
							description: unusedExternalTool.description,
						},
					],
					collapsed: mediaBoard.collapsed as boolean,
					backgroundColor: mediaBoard.backgroundColor as MediaBoardColors,
				});
			});
		});

		describe('when the user is unauthorized', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard]);
				em.clear();

				return {
					mediaBoard,
				};
			};

			it('should return unauthorized', async () => {
				const { mediaBoard } = await setup();

				const response = await testApiClient.get(`${mediaBoard.id}/media-available-line`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
					title: 'Unauthorized',
					type: 'UNAUTHORIZED',
				});
			});
		});

		describe('when the user is invalid', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: new ObjectId().toHexString(),
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

			it('should return forbidden', async () => {
				const { studentClient, mediaBoard } = await setup();

				const response = await studentClient.get(`${mediaBoard.id}/media-available-line`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual({
					code: HttpStatus.FORBIDDEN,
					message: 'Forbidden',
					title: 'Forbidden',
					type: 'FORBIDDEN',
				});
			});
		});

		describe('when the media board feature is disabled', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
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

			it('should return forbidden', async () => {
				const { studentClient, mediaBoard } = await setup();

				const response = await studentClient.get(`${mediaBoard.id}/media-available-line`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual({
					code: HttpStatus.FORBIDDEN,
					message: 'Forbidden',
					title: 'Feature Disabled',
					type: 'FEATURE_DISABLED',
				});
			});
		});

		describe('when a licensing feature is enabled', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;
				config.FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const externalTool = externalToolEntityFactory.build();
				const licensedUnusedExternalTool = externalToolEntityFactory.withMedium().build();
				const unusedExternalTool = externalToolEntityFactory.build({ medium: { mediumId: 'notLicensedByUser' } });
				const schoolExternalTool = schoolExternalToolEntityFactory.build({
					tool: externalTool,
					school: studentUser.school,
				});
				const licensedUnusedSchoolExternalTool = schoolExternalToolEntityFactory.build({
					tool: licensedUnusedExternalTool,
					school: studentUser.school,
				});
				const unusedSchoolExternalTool = schoolExternalToolEntityFactory.build({
					tool: unusedExternalTool,
					school: studentUser.school,
				});
				const contextExternalTool = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalTool,
				});

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build();
				const mediaElement = mediaExternalToolElementEntityFactory.withParent(mediaLine).build({
					contextExternalToolId: contextExternalTool.id,
				});

				const userLicense: MediaUserLicenseEntity = mediaUserLicenseEntityFactory.build({
					user: studentUser,
					mediumId: 'mediumId',
					mediaSourceId: 'mediaSourceId',
				});

				await em.persistAndFlush([
					studentAccount,
					studentUser,
					externalTool,
					licensedUnusedExternalTool,
					unusedExternalTool,
					schoolExternalTool,
					licensedUnusedSchoolExternalTool,
					unusedSchoolExternalTool,
					contextExternalTool,
					mediaBoard,
					mediaLine,
					mediaElement,
					userLicense,
				]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
					licensedUnusedExternalTool,
					licensedUnusedSchoolExternalTool,
				};
			};

			it('should return the available media line with only the licensed element', async () => {
				const { studentClient, mediaBoard, licensedUnusedExternalTool, licensedUnusedSchoolExternalTool } =
					await setup();

				const response = await studentClient.get(`${mediaBoard.id}/media-available-line`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<MediaAvailableLineResponse>({
					elements: [
						{
							schoolExternalToolId: licensedUnusedSchoolExternalTool.id,
							name: licensedUnusedExternalTool.name,
							description: licensedUnusedExternalTool.description,
						},
					],
					collapsed: false,
					backgroundColor: MediaBoardColors.TRANSPARENT,
				});
			});
		});
	});

	describe('[GET] /media-board/:boardId/media-available-line/collapse', () => {
		describe('when a valid user requests their available media line', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const externalTool = externalToolEntityFactory.build();
				const unusedExternalTool = externalToolEntityFactory.build();
				const schoolExternalTool = schoolExternalToolEntityFactory.build({
					tool: externalTool,
					school: studentUser.school,
				});
				const unusedSchoolExternalTool = schoolExternalToolEntityFactory.build({
					tool: unusedExternalTool,
					school: studentUser.school,
				});
				const contextExternalTool = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalTool,
				});

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build({ collapsed: false });
				const mediaElement = mediaExternalToolElementEntityFactory
					.withParent(mediaLine)
					.build({ contextExternalToolId: contextExternalTool.id });

				await em.persistAndFlush([
					studentAccount,
					studentUser,
					externalTool,
					unusedExternalTool,
					schoolExternalTool,
					unusedSchoolExternalTool,
					contextExternalTool,
					mediaBoard,
					mediaLine,
					mediaElement,
				]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
					unusedExternalTool,
					unusedSchoolExternalTool,
				};
			};

			it('should set background color for available media line', async () => {
				const { studentClient, mediaBoard } = await setup();

				const response = await studentClient.patch<CollapsableBodyParams>(
					`${mediaBoard.id}/media-available-line/collapse`,
					{
						collapsed: true,
					}
				);

				expect(response.status).toEqual(HttpStatus.NO_CONTENT);
				const modifiedBoard = await em.findOneOrFail(BoardNodeEntity, mediaBoard.id);
				expect(modifiedBoard.collapsed).toBe(true);
			});
		});

		describe('when the user is unauthorized', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard]);
				em.clear();

				return {
					mediaBoard,
				};
			};

			it('should return unauthorized', async () => {
				const { mediaBoard } = await setup();

				const response = await testApiClient.patch<CollapsableBodyParams>(
					`${mediaBoard.id}/media-available-line/collapse`,
					{
						collapsed: true,
					}
				);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
					title: 'Unauthorized',
					type: 'UNAUTHORIZED',
				});
			});
		});

		describe('when the user is invalid', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: new ObjectId().toHexString(),
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

			it('should return forbidden', async () => {
				const { studentClient, mediaBoard } = await setup();

				const response = await studentClient.patch<CollapsableBodyParams>(
					`${mediaBoard.id}/media-available-line/collapse`,
					{
						collapsed: true,
					}
				);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual({
					code: HttpStatus.FORBIDDEN,
					message: 'Forbidden',
					title: 'Forbidden',
					type: 'FORBIDDEN',
				});
			});
		});
	});

	describe('[GET] /media-board/:boardId/media-available-line/color', () => {
		describe('when a valid user requests their available media line', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const externalTool = externalToolEntityFactory.build();
				const unusedExternalTool = externalToolEntityFactory.build();
				const schoolExternalTool = schoolExternalToolEntityFactory.build({
					tool: externalTool,
					school: studentUser.school,
				});
				const unusedSchoolExternalTool = schoolExternalToolEntityFactory.build({
					tool: unusedExternalTool,
					school: studentUser.school,
				});
				const contextExternalTool = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalTool,
				});

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build({ collapsed: false });
				const mediaElement = mediaExternalToolElementEntityFactory
					.withParent(mediaLine)
					.build({ contextExternalToolId: contextExternalTool.id });

				await em.persistAndFlush([
					studentAccount,
					studentUser,
					externalTool,
					unusedExternalTool,
					schoolExternalTool,
					unusedSchoolExternalTool,
					contextExternalTool,
					mediaBoard,
					mediaLine,
					mediaElement,
				]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
					unusedExternalTool,
					unusedSchoolExternalTool,
				};
			};

			it('should set background color for available media line', async () => {
				const { studentClient, mediaBoard } = await setup();

				const response = await studentClient.patch<ColorBodyParams>(`${mediaBoard.id}/media-available-line/color`, {
					backgroundColor: MediaBoardColors.BLUE,
				});

				expect(response.status).toEqual(HttpStatus.NO_CONTENT);
				const modifiedBoard = await em.findOneOrFail(BoardNodeEntity, mediaBoard.id);
				expect(modifiedBoard.backgroundColor).toBe(MediaBoardColors.BLUE);
			});
		});

		describe('when the user is unauthorized', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard]);
				em.clear();

				return {
					mediaBoard,
				};
			};

			it('should return unauthorized', async () => {
				const { mediaBoard } = await setup();

				const response = await testApiClient.patch<ColorBodyParams>(`${mediaBoard.id}/media-available-line/color`, {
					backgroundColor: MediaBoardColors.BLUE,
				});

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
					title: 'Unauthorized',
					type: 'UNAUTHORIZED',
				});
			});
		});

		describe('when the user is invalid', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: new ObjectId().toHexString(),
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

			it('should return forbidden', async () => {
				const { studentClient, mediaBoard } = await setup();

				const response = await studentClient.patch<ColorBodyParams>(`${mediaBoard.id}/media-available-line/color`, {
					backgroundColor: MediaBoardColors.BLUE,
				});

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual({
					code: HttpStatus.FORBIDDEN,
					message: 'Forbidden',
					title: 'Forbidden',
					type: 'FORBIDDEN',
				});
			});
		});

		describe('when the media board feature is disabled', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
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

			it('should return forbidden', async () => {
				const { studentClient, mediaBoard } = await setup();

				const response = await studentClient.patch<ColorBodyParams>(`${mediaBoard.id}/media-available-line/color`, {
					backgroundColor: MediaBoardColors.BLUE,
				});

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual({
					code: HttpStatus.FORBIDDEN,
					message: 'Forbidden',
					title: 'Feature Disabled',
					type: 'FEATURE_DISABLED',
				});
			});
		});
	});

	describe('[GET] /media-board/:boardId/layout', () => {
		describe('when a valid user set layout for media board', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build();
				const mediaElement = mediaExternalToolElementEntityFactory.withParent(mediaLine).build();

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

			it('should set grid layout for media board ', async () => {
				const { studentClient, mediaBoard } = await setup();

				const response = await studentClient.patch<LayoutBodyParams>(`${mediaBoard.id}/layout`, {
					layout: BoardLayout.GRID,
				});

				expect(response.status).toEqual(HttpStatus.NO_CONTENT);
				const modifiedBoard = await em.findOneOrFail(BoardNodeEntity, mediaBoard.id);
				expect(modifiedBoard.layout).toBe(BoardLayout.GRID);
			});
		});

		describe('when the user is unauthorized', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard]);
				em.clear();

				return {
					mediaBoard,
				};
			};

			it('should return unauthorized', async () => {
				const { mediaBoard } = await setup();

				const response = await testApiClient.get(`${mediaBoard.id}/media-available-line`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
					title: 'Unauthorized',
					type: 'UNAUTHORIZED',
				});
			});
		});

		describe('when the user is invalid', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: new ObjectId().toHexString(),
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

			it('should return forbidden', async () => {
				const { studentClient, mediaBoard } = await setup();

				const response = await studentClient.get(`${mediaBoard.id}/media-available-line`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual({
					code: HttpStatus.FORBIDDEN,
					message: 'Forbidden',
					title: 'Forbidden',
					type: 'FORBIDDEN',
				});
			});
		});

		describe('when the media board feature is disabled', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
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

			it('should return forbidden', async () => {
				const { studentClient, mediaBoard } = await setup();

				const response = await studentClient.get(`${mediaBoard.id}/media-available-line`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual({
					code: HttpStatus.FORBIDDEN,
					message: 'Forbidden',
					title: 'Feature Disabled',
					type: 'FEATURE_DISABLED',
				});
			});
		});
	});
});
