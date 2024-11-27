import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Action, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { setupEntities, userFactory as userEntityFactory } from '@shared/testing';
import type { MediaBoardConfig } from '../../media-board.config';
import { BoardNodePermissionService, BoardNodeService, MediaBoardService } from '../../service';
import { mediaBoardFactory, mediaLineFactory } from '../../testing';
import { MediaBoardUc } from './media-board.uc';
import { BoardLayout, MediaBoardNodeFactory } from '../../domain';

describe(MediaBoardUc.name, () => {
	let module: TestingModule;
	let uc: MediaBoardUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let mediaBoardService: DeepMocked<MediaBoardService>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let boardNodePermissionService: DeepMocked<BoardNodePermissionService>;
	let configService: DeepMocked<ConfigService<MediaBoardConfig, true>>;
	let mediaBoardNodeFactory: DeepMocked<MediaBoardNodeFactory>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				MediaBoardUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: MediaBoardService,
					useValue: createMock<MediaBoardService>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: BoardNodePermissionService,
					useValue: createMock<BoardNodePermissionService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: MediaBoardNodeFactory,
					useValue: createMock<MediaBoardNodeFactory>(),
				},
			],
		}).compile();

		uc = module.get(MediaBoardUc);
		authorizationService = module.get(AuthorizationService);
		mediaBoardService = module.get(MediaBoardService);
		boardNodeService = module.get(BoardNodeService);
		boardNodePermissionService = module.get(BoardNodePermissionService);
		configService = module.get(ConfigService);
		mediaBoardNodeFactory = module.get(MediaBoardNodeFactory);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getMediaBoardForUser', () => {
		describe('when the user has no media board', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaBoard = mediaBoardFactory.build();

				configService.get.mockReturnValueOnce(true);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaBoardService.findByExternalReference.mockResolvedValueOnce([]);
				mediaBoardNodeFactory.buildMediaBoard.mockReturnValueOnce(mediaBoard);

				return {
					user,
					mediaBoard,
				};
			};

			it('should check the authorization', async () => {
				const { user } = setup();

				await uc.getMediaBoardForUser(user.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					user,
					AuthorizationContextBuilder.read([])
				);
			});

			it('should return a new media board', async () => {
				const { user, mediaBoard } = setup();

				const result = await uc.getMediaBoardForUser(user.id);

				expect(result).toEqual(mediaBoard);
			});
		});

		describe('when the user has a media board', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaBoard = mediaBoardFactory.build();

				configService.get.mockReturnValueOnce(true);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaBoardService.findByExternalReference.mockResolvedValueOnce([mediaBoard]);

				return {
					user,
					mediaBoard,
				};
			};

			it('should check the authorization', async () => {
				const { user } = setup();

				await uc.getMediaBoardForUser(user.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					user,
					AuthorizationContextBuilder.read([])
				);
			});

			it('should return the existing media board', async () => {
				const { user, mediaBoard } = setup();

				const result = await uc.getMediaBoardForUser(user.id);

				expect(result).toEqual(mediaBoard);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userEntityFactory.build();

				configService.get.mockReturnValueOnce(false);

				return {
					user,
				};
			};

			it('should throw an exception', async () => {
				const { user } = setup();

				await expect(uc.getMediaBoardForUser(user.id)).rejects.toThrow(FeatureDisabledLoggableException);
			});
		});
	});

	describe('createLine', () => {
		describe('when the user creates a new media line', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaBoard = mediaBoardFactory.build();
				const mediaLine = mediaLineFactory.build();

				configService.get.mockReturnValueOnce(true);

				boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaBoard);
				mediaBoardNodeFactory.buildMediaLine.mockReturnValueOnce(mediaLine);

				return {
					user,
					mediaBoard,
					mediaLine,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaBoard } = setup();

				await uc.createLine(user.id, mediaBoard.id);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, mediaBoard, Action.write);
			});

			it('should return a new media line', async () => {
				const { user, mediaBoard, mediaLine } = setup();

				const result = await uc.createLine(user.id, mediaBoard.id);

				expect(result).toEqual(mediaLine);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaBoard = mediaBoardFactory.build();

				configService.get.mockReturnValueOnce(false);

				return {
					user,
					mediaBoard,
				};
			};

			it('should throw an exception', async () => {
				const { user, mediaBoard } = setup();

				await expect(uc.createLine(user.id, mediaBoard.id)).rejects.toThrow(FeatureDisabledLoggableException);
			});
		});
	});

	describe('setLayout', () => {
		describe('when the user changes the layout of the media board', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaBoard = mediaBoardFactory.build({
					layout: BoardLayout.LIST,
				});

				configService.get.mockReturnValueOnce(true);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaBoard);

				return {
					user,
					mediaBoard,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaBoard } = setup();

				await uc.setLayout(user.id, mediaBoard.id, BoardLayout.GRID);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, mediaBoard, Action.write);
			});

			it('should change the layout', async () => {
				const { user, mediaBoard } = setup();

				await uc.setLayout(user.id, mediaBoard.id, BoardLayout.GRID);

				expect(mediaBoardService.updateLayout).toHaveBeenCalledWith(mediaBoard, BoardLayout.GRID);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaBoard = mediaBoardFactory.build();

				configService.get.mockReturnValueOnce(false);

				return {
					user,
					mediaBoard,
				};
			};

			it('should throw an exception', async () => {
				const { user, mediaBoard } = setup();

				await expect(uc.setLayout(user.id, mediaBoard.id, BoardLayout.GRID)).rejects.toThrow(
					FeatureDisabledLoggableException
				);
			});
		});
	});
});
