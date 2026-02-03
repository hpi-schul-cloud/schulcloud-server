import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { BOARD_CONFIG_TOKEN, BoardConfig } from '@modules/board/board.config';
import { mediaSourceEntityFactory } from '@modules/media-source/testing';
import { ServerTestModule } from '@modules/server';
import { contextExternalToolEntityFactory } from '@modules/tool/context-external-tool/testing';
import { externalToolEntityFactory } from '@modules/tool/external-tool/testing';
import { schoolExternalToolEntityFactory } from '@modules/tool/school-external-tool/testing';
import { MediaUserLicenseEntity } from '@modules/user-license/entity';
import { mediaUserLicenseEntityFactory } from '@modules/user-license/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DateToString } from '@testing/date-to-string';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
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
	type MediaBoardResponse,
	MediaLineResponse,
} from '../dto';

const baseRouteName = '/media-boards';

describe('Media Board (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let config: BoardConfig;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);

		config = module.get<BoardConfig>(BOARD_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('[GET] /media-boards/me', () => {
		describe('when a valid user accesses their media board', () => {
			const setup = async () => {
				config.featureMediaShelfEnabled = true;

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

				await em.persist([studentAccount, studentUser, mediaBoard, mediaLine, mediaElement]).flush();
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

				expect(response.body).toEqual<DateToString<MediaBoardResponse>>({
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
										lastUpdatedAt: expect.stringMatching(
											/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
										) as unknown as string, // any iso string, to avoid ms differences based unstable test
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
				config.featureMediaShelfEnabled = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persist([studentAccount, studentUser]).flush();
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
				config.featureMediaShelfEnabled = true;
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
				config.featureMediaShelfEnabled = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persist([studentAccount, studentUser, mediaBoard]).flush();
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

				expect(response.body).toEqual<DateToString<MediaLineResponse>>({
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
				config.featureMediaShelfEnabled = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persist([studentAccount, studentUser]).flush();
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
				config.featureMediaShelfEnabled = true;

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: new ObjectId().toHexString(),
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persist([mediaBoard]).flush();
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
				config.featureMediaShelfEnabled = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const externalTool = externalToolEntityFactory.build();
				const fileRecordId = new ObjectId();
				const fileName = 'test.png';
				const unusedExternalTool = externalToolEntityFactory.build({
					thumbnail: {
						uploadUrl: 'https://uploadurl.com',
						fileRecord: fileRecordId,
						fileName,
					},
				});
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

				await em
					.persist([
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
					])
					.flush();
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
					unusedExternalTool,
					unusedSchoolExternalTool,
					fileRecordId,
					fileName,
				};
			};

			it('should return the available media line', async () => {
				const { studentClient, mediaBoard, unusedExternalTool, unusedSchoolExternalTool, fileRecordId, fileName } =
					await setup();

				const response = await studentClient.get(`${mediaBoard.id}/media-available-line`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<MediaAvailableLineResponse>({
					elements: [
						{
							schoolExternalToolId: unusedSchoolExternalTool.id,
							name: unusedExternalTool.name,
							domain: new URL(unusedExternalTool.config.baseUrl).hostname,
							description: unusedExternalTool.description,
							thumbnailUrl: `/api/v3/file/preview/${fileRecordId.toHexString()}/${encodeURIComponent(fileName)}`,
						},
					],
					collapsed: mediaBoard.collapsed as boolean,
					backgroundColor: mediaBoard.backgroundColor as MediaBoardColors,
				});
			});
		});

		describe('when the user is unauthorized', () => {
			const setup = async () => {
				config.featureMediaShelfEnabled = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persist([studentAccount, studentUser, mediaBoard]).flush();
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
				config.featureMediaShelfEnabled = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: new ObjectId().toHexString(),
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persist([studentAccount, studentUser, mediaBoard]).flush();
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
				config.featureMediaShelfEnabled = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persist([studentAccount, studentUser, mediaBoard]).flush();
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
				config.featureMediaShelfEnabled = true;
				config.featureSchulconnexMediaLicenseEnabled = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaSource = mediaSourceEntityFactory.build();
				const externalTool = externalToolEntityFactory.build();
				const fileRecordId = new ObjectId();
				const fileName = 'test.png';
				const licensedUnusedExternalTool = externalToolEntityFactory
					.withMedium({
						mediumId: 'mediumId',
						mediaSourceId: mediaSource.sourceId,
					})
					.build({
						thumbnail: {
							uploadUrl: 'https://uploadurl.com',
							fileRecord: fileRecordId,
							fileName,
						},
					});
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
					mediaSource,
				});

				await em
					.persist([
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
					])
					.flush();
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
					licensedUnusedExternalTool,
					licensedUnusedSchoolExternalTool,
					fileRecordId,
					fileName,
				};
			};

			it('should return the available media line with only the licensed element', async () => {
				const {
					studentClient,
					mediaBoard,
					licensedUnusedExternalTool,
					licensedUnusedSchoolExternalTool,
					fileRecordId,
					fileName,
				} = await setup();

				const response = await studentClient.get(`${mediaBoard.id}/media-available-line`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<MediaAvailableLineResponse>({
					elements: [
						{
							schoolExternalToolId: licensedUnusedSchoolExternalTool.id,
							name: licensedUnusedExternalTool.name,
							domain: new URL(licensedUnusedExternalTool.config.baseUrl).hostname,
							description: licensedUnusedExternalTool.description,
							thumbnailUrl: `/api/v3/file/preview/${fileRecordId.toHexString()}/${encodeURIComponent(fileName)}`,
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
				config.featureMediaShelfEnabled = true;

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

				await em
					.persist([
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
					])
					.flush();
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
				config.featureMediaShelfEnabled = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persist([studentAccount, studentUser, mediaBoard]).flush();
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
				config.featureMediaShelfEnabled = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: new ObjectId().toHexString(),
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persist([studentAccount, studentUser, mediaBoard]).flush();
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
				config.featureMediaShelfEnabled = true;

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

				await em
					.persist([
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
					])
					.flush();
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
				config.featureMediaShelfEnabled = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persist([studentAccount, studentUser, mediaBoard]).flush();
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
				config.featureMediaShelfEnabled = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: new ObjectId().toHexString(),
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persist([studentAccount, studentUser, mediaBoard]).flush();
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
				config.featureMediaShelfEnabled = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persist([studentAccount, studentUser, mediaBoard]).flush();
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
				config.featureMediaShelfEnabled = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build();
				const mediaElement = mediaExternalToolElementEntityFactory.withParent(mediaLine).build();

				await em.persist([studentAccount, studentUser, mediaBoard, mediaLine, mediaElement]).flush();
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
				config.featureMediaShelfEnabled = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persist([studentAccount, studentUser, mediaBoard]).flush();
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
				config.featureMediaShelfEnabled = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: new ObjectId().toHexString(),
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persist([studentAccount, studentUser, mediaBoard]).flush();
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
				config.featureMediaShelfEnabled = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				await em.persist([studentAccount, studentUser, mediaBoard]).flush();
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
