import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { setupEntities } from '@testing/database';
import { BoardNodeRule } from '../../authorisation/board-node.rule';
import { BOARD_CONFIG_TOKEN, BoardConfig } from '../../board.config';
import { BoardNodeAuthorizable, MediaBoard, MediaLine } from '../../domain';
import { MediaBoardColors } from '../../domain/media-board/types';
import { BoardNodeAuthorizableService, BoardNodeService, MediaBoardService } from '../../service';
import { mediaBoardFactory, mediaLineFactory } from '../../testing';
import { MediaLineUc } from './media-line.uc';

describe(MediaLineUc.name, () => {
	let module: TestingModule;
	let uc: MediaLineUc;

	let mediaBoardService: DeepMocked<MediaBoardService>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let config: BoardConfig;
	let boardNodeAuthorizableService: DeepMocked<BoardNodeAuthorizableService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let boardNodeRule: DeepMocked<BoardNodeRule>;

	beforeAll(async () => {
		await setupEntities([User]);

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
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: BoardNodeAuthorizableService,
					useValue: createMock<BoardNodeAuthorizableService>(),
				},
				{
					provide: BOARD_CONFIG_TOKEN,
					useValue: new BoardConfig(),
				},
				{
					provide: BoardNodeRule,
					useValue: createMock<BoardNodeRule>(),
				},
			],
		}).compile();

		uc = module.get(MediaLineUc);
		mediaBoardService = module.get(MediaBoardService);
		boardNodeService = module.get(BoardNodeService);
		config = module.get(BOARD_CONFIG_TOKEN);
		boardNodeAuthorizableService = module.get(BoardNodeAuthorizableService);
		authorizationService = module.get(AuthorizationService);
		boardNodeRule = module.get(BoardNodeRule);
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
				const user = userFactory.build();
				const mediaBoard: MediaBoard = mediaBoardFactory.build();
				const mediaLine = mediaLineFactory.build();

				config.featureMediaShelfEnabled = true;

				boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaLine).mockResolvedValueOnce(mediaBoard);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					mediaBoard as unknown as BoardNodeAuthorizable
				);
				boardNodeRule.canCreateMediaBoardLine.mockReturnValue(true);

				return {
					user,
					mediaBoard,
					mediaLine,
				};
			};
			it('should call boardNodeService to find line, target board', async () => {
				const { user, mediaLine, mediaBoard } = setup();

				await uc.moveLine(user.id, mediaLine.id, mediaBoard.id, 1);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(MediaLine, mediaLine.id);
				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(MediaBoard, mediaBoard.id);
			});

			it('should check the authorization', async () => {
				const { user, mediaLine, mediaBoard } = setup();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					mediaBoard as unknown as BoardNodeAuthorizable
				);
				boardNodeRule.canCreateMediaBoardLine.mockReturnValueOnce(true);

				await uc.moveLine(user.id, mediaLine.id, mediaBoard.id, 1);

				expect(boardNodeRule.canCreateMediaBoardLine).toHaveBeenCalledWith(user, mediaBoard);
			});

			it('should move the line', async () => {
				const { user, mediaLine, mediaBoard } = setup();

				await uc.moveLine(user.id, mediaLine.id, mediaBoard.id, 1);

				expect(boardNodeService.move).toHaveBeenCalledWith(mediaLine, mediaBoard, 1);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userFactory.build();
				const mediaBoard = mediaBoardFactory.build();
				const mediaLine = mediaLineFactory.build();

				config.featureMediaShelfEnabled = false;

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
				const user = userFactory.build();
				const mediaLine = mediaLineFactory.build();

				config.featureMediaShelfEnabled = true;

				boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaLine);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					mediaLine as unknown as BoardNodeAuthorizable
				);
				boardNodeRule.canUpdateMediaBoardLine.mockReturnValue(true);

				return {
					user,
					mediaLine,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaLine } = setup();
				boardNodeRule.canUpdateMediaBoardLine.mockReturnValueOnce(true);

				await uc.updateLineTitle(user.id, mediaLine.id, 'newTitle');

				expect(boardNodeRule.canUpdateMediaBoardLine).toHaveBeenCalledWith(user, mediaLine);
			});

			it('should rename the line', async () => {
				const { user, mediaLine } = setup();

				await uc.updateLineTitle(user.id, mediaLine.id, 'newTitle');

				expect(boardNodeService.updateTitle).toHaveBeenCalledWith(mediaLine, 'newTitle');
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userFactory.build();
				const mediaLine = mediaLineFactory.build();

				config.featureMediaShelfEnabled = false;

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
				const user = userFactory.build();
				const mediaLine = mediaLineFactory.build();

				config.featureMediaShelfEnabled = true;
				boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaLine);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					mediaLine as unknown as BoardNodeAuthorizable
				);
				boardNodeRule.canDeleteMediaBoardLine.mockReturnValue(true);

				return { user, mediaLine };
			};

			it('should check the authorization', async () => {
				const { user, mediaLine } = setup();
				boardNodeRule.canDeleteMediaBoardLine.mockReturnValueOnce(true);

				await uc.deleteLine(user.id, mediaLine.id);

				expect(boardNodeRule.canDeleteMediaBoardLine).toHaveBeenCalledWith(user, mediaLine);
			});

			it('should delete the line', async () => {
				const { user, mediaLine } = setup();

				await uc.deleteLine(user.id, mediaLine.id);

				expect(boardNodeService.delete).toHaveBeenCalledWith(mediaLine);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userFactory.build();
				const mediaLine = mediaLineFactory.build();

				config.featureMediaShelfEnabled = false;

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
				const user = userFactory.build();
				const mediaLine = mediaLineFactory.build();

				config.featureMediaShelfEnabled = true;

				boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaLine);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					mediaLine as unknown as BoardNodeAuthorizable
				);
				boardNodeRule.canUpdateElement.mockReturnValue(true);

				return {
					user,
					mediaLine,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaLine } = setup();
				boardNodeRule.canUpdateMediaBoardLine.mockReturnValueOnce(true);

				await uc.updateLineColor(user.id, mediaLine.id, MediaBoardColors.BLUE);

				expect(boardNodeRule.canUpdateMediaBoardLine).toHaveBeenCalledWith(user, mediaLine);
			});

			it('should set background color', async () => {
				const { user, mediaLine } = setup();
				boardNodeRule.canUpdateMediaBoardLine.mockReturnValueOnce(true);

				await uc.updateLineColor(user.id, mediaLine.id, MediaBoardColors.BLUE);

				expect(mediaBoardService.updateBackgroundColor).toHaveBeenCalledWith(mediaLine, 'blue');
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userFactory.build();
				const mediaLine = mediaLineFactory.build();

				config.featureMediaShelfEnabled = false;

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
				const user = userFactory.build();
				const mediaLine = mediaLineFactory.build();

				config.featureMediaShelfEnabled = true;

				boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaLine);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					mediaLine as unknown as BoardNodeAuthorizable
				);
				boardNodeRule.canUpdateMediaBoardLine.mockReturnValue(true);

				return {
					user,
					mediaLine,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaLine } = setup();
				boardNodeRule.canUpdateMediaBoardLine.mockReturnValueOnce(true);

				await uc.collapseLine(user.id, mediaLine.id, true);

				expect(boardNodeRule.canUpdateMediaBoardLine).toHaveBeenCalledWith(user, mediaLine);
			});

			it('should collapse the line', async () => {
				const { user, mediaLine } = setup();

				await uc.collapseLine(user.id, mediaLine.id, true);

				expect(mediaBoardService.updateCollapsed).toHaveBeenCalledWith(mediaLine, true);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userFactory.build();
				const mediaLine = mediaLineFactory.build();

				config.featureMediaShelfEnabled = false;

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
