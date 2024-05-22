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
import { MediaBoardColors } from '../../domain';
import type { MediaBoardConfig } from '../../media-board.config';
import { BoardDoAuthorizableService, MediaBoardService, MediaLineService } from '../../service';
import { MediaLineUc } from './media-line.uc';

describe(MediaLineUc.name, () => {
	let module: TestingModule;
	let uc: MediaLineUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let mediaBoardService: DeepMocked<MediaBoardService>;
	let mediaLineService: DeepMocked<MediaLineService>;
	let boardDoAuthorizableService: DeepMocked<BoardDoAuthorizableService>;
	let configService: DeepMocked<ConfigService<MediaBoardConfig, true>>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				MediaLineUc,
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

		uc = module.get(MediaLineUc);
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

	describe('moveLine', () => {
		describe('when the user moves a media line', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaBoard = mediaBoardFactory.build();
				const mediaLine = mediaLineFactory.build();
				const boardDoAuthorizable = boardDoAuthorizableFactory.build();

				configService.get.mockReturnValueOnce(true);
				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardDoAuthorizable);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaBoardService.findById.mockResolvedValueOnce(mediaBoard);
				mediaLineService.findById.mockResolvedValueOnce(mediaLine);

				return {
					user,
					mediaBoard,
					mediaLine,
					boardDoAuthorizable,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaLine, mediaBoard, boardDoAuthorizable } = setup();

				await uc.moveLine(user.id, mediaLine.id, mediaBoard.id, 1);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					boardDoAuthorizable,
					AuthorizationContextBuilder.write([])
				);
			});

			it('should move the line', async () => {
				const { user, mediaLine, mediaBoard } = setup();

				await uc.moveLine(user.id, mediaLine.id, mediaBoard.id, 1);

				expect(mediaLineService.move).toHaveBeenCalledWith(mediaLine, mediaBoard, 1);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaBoard = mediaBoardFactory.build();
				const mediaLine = mediaLineFactory.build();

				configService.get.mockReturnValueOnce(false);

				return {
					user,
					mediaBoard,
					mediaLine,
				};
			};

			it('should throw an exception', async () => {
				const { user, mediaLine, mediaBoard } = setup();

				await expect(uc.moveLine(user.id, mediaLine.id, mediaBoard.id, 1)).rejects.toThrow(
					FeatureDisabledLoggableException
				);
			});
		});
	});

	describe('updateLineTitle', () => {
		describe('when the user renames a media line', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaLine = mediaLineFactory.build();
				const boardDoAuthorizable = boardDoAuthorizableFactory.build();

				configService.get.mockReturnValueOnce(true);
				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardDoAuthorizable);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaLineService.findById.mockResolvedValueOnce(mediaLine);

				return {
					user,
					mediaLine,
					boardDoAuthorizable,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaLine, boardDoAuthorizable } = setup();

				await uc.updateLineTitle(user.id, mediaLine.id, 'newTitle');

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					boardDoAuthorizable,
					AuthorizationContextBuilder.write([])
				);
			});

			it('should rename the line', async () => {
				const { user, mediaLine } = setup();

				await uc.updateLineTitle(user.id, mediaLine.id, 'newTitle');

				expect(mediaLineService.updateTitle).toHaveBeenCalledWith(mediaLine, 'newTitle');
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaLine = mediaLineFactory.build();

				configService.get.mockReturnValueOnce(false);

				return {
					user,
					mediaLine,
				};
			};

			it('should throw an exception', async () => {
				const { user, mediaLine } = setup();

				await expect(uc.updateLineTitle(user.id, mediaLine.id, 'newTitle')).rejects.toThrow(
					FeatureDisabledLoggableException
				);
			});
		});
	});

	describe('deleteLine', () => {
		describe('when the user deletes a media line', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaLine = mediaLineFactory.build();
				const boardDoAuthorizable = boardDoAuthorizableFactory.build();

				configService.get.mockReturnValueOnce(true);
				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardDoAuthorizable);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaLineService.findById.mockResolvedValueOnce(mediaLine);

				return {
					user,
					mediaLine,
					boardDoAuthorizable,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaLine, boardDoAuthorizable } = setup();

				await uc.deleteLine(user.id, mediaLine.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					boardDoAuthorizable,
					AuthorizationContextBuilder.write([])
				);
			});

			it('should delete the line', async () => {
				const { user, mediaLine } = setup();

				await uc.deleteLine(user.id, mediaLine.id);

				expect(mediaLineService.delete).toHaveBeenCalledWith(mediaLine);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaLine = mediaLineFactory.build();

				configService.get.mockReturnValueOnce(false);

				return {
					user,
					mediaLine,
				};
			};

			it('should throw an exception', async () => {
				const { user, mediaLine } = setup();

				await expect(uc.deleteLine(user.id, mediaLine.id)).rejects.toThrow(FeatureDisabledLoggableException);
			});
		});
	});

	describe('updateLineColor', () => {
		describe('when the user changes background color of media line', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaLine = mediaLineFactory.build();
				const boardDoAuthorizable = boardDoAuthorizableFactory.build();

				configService.get.mockReturnValueOnce(true);
				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardDoAuthorizable);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaLineService.findById.mockResolvedValueOnce(mediaLine);

				return {
					user,
					mediaLine,
					boardDoAuthorizable,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaLine, boardDoAuthorizable } = setup();

				await uc.updateLineColor(user.id, mediaLine.id, MediaBoardColors.BLUE);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					boardDoAuthorizable,
					AuthorizationContextBuilder.write([])
				);
			});

			it('should set background color', async () => {
				const { user, mediaLine } = setup();

				await uc.updateLineColor(user.id, mediaLine.id, MediaBoardColors.BLUE);

				expect(mediaLineService.updateColor).toHaveBeenCalledWith(mediaLine, 'blue');
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaLine = mediaLineFactory.build();

				configService.get.mockReturnValueOnce(false);

				return {
					user,
					mediaLine,
				};
			};

			it('should throw an exception', async () => {
				const { user, mediaLine } = setup();

				await expect(uc.updateLineColor(user.id, mediaLine.id, MediaBoardColors.BLUE)).rejects.toThrow(
					FeatureDisabledLoggableException
				);
			});
		});
	});

	describe('collapseLine', () => {
		describe('when the user collapse a media line', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaLine = mediaLineFactory.build();
				const boardDoAuthorizable = boardDoAuthorizableFactory.build();

				configService.get.mockReturnValueOnce(true);
				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardDoAuthorizable);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaLineService.findById.mockResolvedValueOnce(mediaLine);

				return {
					user,
					mediaLine,
					boardDoAuthorizable,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaLine, boardDoAuthorizable } = setup();

				await uc.collapseLine(user.id, mediaLine.id, true);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					boardDoAuthorizable,
					AuthorizationContextBuilder.write([])
				);
			});

			it('should collapse the line', async () => {
				const { user, mediaLine } = setup();

				await uc.collapseLine(user.id, mediaLine.id, true);

				expect(mediaLineService.collapse).toHaveBeenCalledWith(mediaLine, true);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaLine = mediaLineFactory.build();

				configService.get.mockReturnValueOnce(false);

				return {
					user,
					mediaLine,
				};
			};

			it('should throw an exception', async () => {
				const { user, mediaLine } = setup();

				await expect(uc.collapseLine(user.id, mediaLine.id, true)).rejects.toThrow(FeatureDisabledLoggableException);
			});
		});
	});
});
