import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import {
	boardDoAuthorizableFactory,
	mediaBoardFactory,
	mediaLineFactory,
	setupEntities,
	userFactory as userEntityFactory,
} from '@shared/testing';
import type { MediaBoardConfig } from '../../media-board.config';
import { BoardDoAuthorizableService, MediaBoardService, MediaLineService } from '../../service';
import { MediaBoardUc } from './media-board.uc';

describe(MediaBoardUc.name, () => {
	let module: TestingModule;
	let uc: MediaBoardUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let mediaBoardService: DeepMocked<MediaBoardService>;
	let mediaLineService: DeepMocked<MediaLineService>;
	let boardDoAuthorizableService: DeepMocked<BoardDoAuthorizableService>;
	let configService: DeepMocked<ConfigService<MediaBoardConfig, true>>;

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
					provide: MediaLineService,
					useValue: createMock<MediaLineService>(),
				},
				{
					provide: BoardDoAuthorizableService,
					useValue: createMock<BoardDoAuthorizableService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		uc = module.get(MediaBoardUc);
		authorizationService = module.get(AuthorizationService);
		mediaBoardService = module.get(MediaBoardService);
		mediaLineService = module.get(MediaLineService);
		boardDoAuthorizableService = module.get(BoardDoAuthorizableService);
		configService = module.get(ConfigService);
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
				mediaBoardService.findIdsByExternalReference.mockResolvedValueOnce([]);
				mediaBoardService.create.mockResolvedValueOnce(mediaBoard);

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
				mediaBoardService.findIdsByExternalReference.mockResolvedValueOnce([mediaBoard.id]);
				mediaBoardService.findById.mockResolvedValueOnce(mediaBoard);

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
				const boardDoAuthorizable = boardDoAuthorizableFactory.build();

				configService.get.mockReturnValueOnce(true);
				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardDoAuthorizable);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaBoardService.findById.mockResolvedValueOnce(mediaBoard);
				mediaLineService.create.mockResolvedValueOnce(mediaLine);

				return {
					user,
					mediaBoard,
					mediaLine,
					boardDoAuthorizable,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaBoard, boardDoAuthorizable } = setup();

				await uc.createLine(user.id, mediaBoard.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					boardDoAuthorizable,
					AuthorizationContextBuilder.write([])
				);
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
});
