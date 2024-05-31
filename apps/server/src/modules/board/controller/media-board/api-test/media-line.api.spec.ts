import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { type ServerConfig, serverConfig, ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { BoardNodeEntity } from '../../../repo';
import { BoardExternalReferenceType, MediaBoardColors } from '../../../domain';
import { MoveColumnBodyParams, RenameBodyParams } from '../../dto';
import { CollapsableBodyParams, ColorBodyParams } from '../dto';
import { mediaBoardEntityFactory, mediaLineEntityFactory } from '../../../testing';

const baseRouteName = '/media-lines';

describe('Media Line (API)', () => {
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

	describe('[POST] /media-lines/:lineId/position', () => {
		describe('when a valid user moves a line on their media board', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.buildWithId({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLineA = mediaLineEntityFactory.withParent(mediaBoard).build({
					position: 0,
				});
				const mediaLineB = mediaLineEntityFactory.withParent(mediaBoard).build({
					position: 1,
				});

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard, mediaLineA, mediaLineB]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
					mediaLineA,
					mediaLineB,
				};
			};

			it('should move the line', async () => {
				const { studentClient, mediaBoard, mediaLineA, mediaLineB } = await setup();

				const response = await studentClient.put<MoveColumnBodyParams>(`${mediaLineA.id}/position`, {
					toBoardId: mediaBoard.id,
					toPosition: 1,
				});

				expect(response.status).toEqual(HttpStatus.NO_CONTENT);
				const modifiedLineA = await em.findOneOrFail(BoardNodeEntity, mediaLineA.id);
				const modifiedLineB = await em.findOneOrFail(BoardNodeEntity, mediaLineB.id);
				expect(modifiedLineA.position).toEqual(1);
				expect(modifiedLineB.position).toEqual(0);
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
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build({
					position: 0,
				});

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard, mediaLine]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
					mediaLine,
				};
			};

			it('should return forbidden', async () => {
				const { studentClient, mediaBoard, mediaLine } = await setup();

				const response = await studentClient.put<MoveColumnBodyParams>(`${mediaLine.id}/position`, {
					toBoardId: mediaBoard.id,
					toPosition: 0,
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

		describe('when the user is invalid', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const mediaBoard = mediaBoardEntityFactory.buildWithId({
					context: {
						id: new ObjectId().toHexString(),
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build({
					position: 0,
				});

				await em.persistAndFlush([mediaBoard, mediaLine]);
				em.clear();

				return {
					mediaBoard,
					mediaLine,
				};
			};

			it('should return unauthorized', async () => {
				const { mediaBoard, mediaLine } = await setup();

				const response = await testApiClient.put<MoveColumnBodyParams>(`${mediaLine.id}/position`, {
					toBoardId: mediaBoard.id,
					toPosition: 0,
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
	});

	describe('[PATCH] /media-lines/:lineId/title', () => {
		describe('when a valid user renames a line on their media board', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.buildWithId({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build({
					title: '',
				});

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard, mediaLine]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
					mediaLine,
				};
			};

			it('should rename the line', async () => {
				const { studentClient, mediaLine } = await setup();

				const response = await studentClient.patch<RenameBodyParams>(`${mediaLine.id}/title`, {
					title: 'newTitle',
				});

				expect(response.status).toEqual(HttpStatus.NO_CONTENT);
				const modifiedLine = await em.findOneOrFail(BoardNodeEntity, mediaLine.id);
				expect(modifiedLine.title).toEqual('newTitle');
			});
		});

		describe('when the media board feature is disabled', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.buildWithId({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build({
					title: '',
				});

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard, mediaLine]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaLine,
				};
			};

			it('should return forbidden', async () => {
				const { studentClient, mediaLine } = await setup();

				const response = await studentClient.patch<RenameBodyParams>(`${mediaLine.id}/title`, {
					title: 'newTitle',
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
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build({
					title: '',
				});

				await em.persistAndFlush([mediaBoard, mediaLine]);
				em.clear();

				return {
					mediaLine,
				};
			};

			it('should return unauthorized', async () => {
				const { mediaLine } = await setup();

				const response = await testApiClient.patch<RenameBodyParams>(`${mediaLine.id}/title`, {
					title: 'newTitle',
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
	});

	describe('[PATCH] /media-lines/:lineId/color', () => {
		describe('when a user changes the background color of a line on their media board', () => {
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

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard, mediaLine]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
					mediaLine,
				};
			};

			it('should change the background color', async () => {
				const { studentClient, mediaLine } = await setup();

				const response = await studentClient.patch<ColorBodyParams>(`${mediaLine.id}/color`, {
					backgroundColor: MediaBoardColors.BLUE,
				});

				expect(response.status).toEqual(HttpStatus.NO_CONTENT);
				const modifiedLine = await em.findOneOrFail(BoardNodeEntity, mediaLine.id);
				expect(modifiedLine.backgroundColor).toEqual(MediaBoardColors.BLUE);
			});
		});

		describe('when the media board feature is disabled', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.buildWithId({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory
					.withParent(mediaBoard)
					.build({ backgroundColor: MediaBoardColors.TRANSPARENT });

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard, mediaLine]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaLine,
				};
			};

			it('should return forbidden', async () => {
				const { studentClient, mediaLine } = await setup();

				const response = await studentClient.patch<ColorBodyParams>(`${mediaLine.id}/color`, {
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

		describe('when the user is invalid', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const mediaBoard = mediaBoardEntityFactory.buildWithId({
					context: {
						id: new ObjectId().toHexString(),
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build({
					backgroundColor: MediaBoardColors.TRANSPARENT,
				});

				await em.persistAndFlush([mediaBoard, mediaLine]);
				em.clear();

				return {
					mediaLine,
				};
			};

			it('should return unauthorized', async () => {
				const { mediaLine } = await setup();

				const response = await testApiClient.patch<ColorBodyParams>(`${mediaLine.id}/color`, {
					backgroundColor: MediaBoardColors.TRANSPARENT,
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
	});

	describe('[PATCH] /media-lines/:lineId/collapse', () => {
		describe('when a valid user collapse a line on their media board', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.buildWithId({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build({ collapsed: false });

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard, mediaLine]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
					mediaLine,
				};
			};

			it('should collapse the line', async () => {
				const { studentClient, mediaLine } = await setup();

				const response = await studentClient.patch<CollapsableBodyParams>(`${mediaLine.id}/collapse`, {
					collapsed: true,
				});

				expect(response.status).toEqual(HttpStatus.NO_CONTENT);
				const modifiedLine = await em.findOneOrFail(BoardNodeEntity, mediaLine.id);
				expect(modifiedLine.collapsed).toEqual(true);
			});
		});

		describe('when the media board feature is disabled', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.buildWithId({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build({ title: '' });

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard, mediaLine]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaLine,
				};
			};

			it('should return forbidden', async () => {
				const { studentClient, mediaLine } = await setup();

				const response = await studentClient.patch<RenameBodyParams>(`${mediaLine.id}/title`, {
					title: 'newTitle',
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

		describe('when the user is invalid', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const mediaBoard = mediaBoardEntityFactory.buildWithId({
					context: {
						id: new ObjectId().toHexString(),
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build({
					title: '',
				});

				await em.persistAndFlush([mediaBoard, mediaLine]);
				em.clear();

				return {
					mediaLine,
				};
			};

			it('should return unauthorized', async () => {
				const { mediaLine } = await setup();

				const response = await testApiClient.patch<RenameBodyParams>(`${mediaLine.id}/title`, {
					title: 'newTitle',
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
	});

	describe('[DELETE] /media-lines/:lineId', () => {
		describe('when a valid user deletes a line on their media board', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.buildWithId({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build();

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard, mediaLine]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
					mediaLine,
				};
			};

			it('should delete the line', async () => {
				const { studentClient, mediaLine } = await setup();

				const response = await studentClient.delete(`${mediaLine.id}`);

				expect(response.status).toEqual(HttpStatus.NO_CONTENT);
				const modifiedLine = await em.findOne(BoardNodeEntity, mediaLine.id);
				expect(modifiedLine).toBeNull();
			});
		});

		describe('when the media board feature is disabled', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.buildWithId({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build();

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard, mediaLine]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaLine,
				};
			};

			it('should return forbidden', async () => {
				const { studentClient, mediaLine } = await setup();

				const response = await studentClient.delete(`${mediaLine.id}`);

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

				const mediaBoard = mediaBoardEntityFactory.buildWithId({
					context: {
						id: new ObjectId().toHexString(),
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build();

				await em.persistAndFlush([mediaBoard, mediaLine]);
				em.clear();

				return {
					mediaLine,
				};
			};

			it('should return unauthorized', async () => {
				const { mediaLine } = await setup();

				const response = await testApiClient.delete(`${mediaLine.id}`);

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
