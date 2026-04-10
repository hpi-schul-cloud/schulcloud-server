import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { BoardNodeRule } from '@modules/board/authorisation/board-node.rule';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userDoFactory, userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { setupEntities } from '@testing/database';
import { BOARD_CONFIG_TOKEN, BoardConfig } from '../../board.config';
import { BoardLayout, BoardNodeAuthorizable, MediaBoardNodeFactory } from '../../domain';
import { BoardNodeAuthorizableService, BoardNodeService, MediaBoardService } from '../../service';
import { mediaBoardFactory, mediaLineFactory } from '../../testing';
import { MediaBoardUc } from './media-board.uc';

describe(MediaBoardUc.name, () => {
	let module: TestingModule;
	let uc: MediaBoardUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let userService: DeepMocked<UserService>;
	let mediaBoardService: DeepMocked<MediaBoardService>;
	let boardNodeRule: DeepMocked<BoardNodeRule>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let config: BoardConfig;
	let mediaBoardNodeFactory: DeepMocked<MediaBoardNodeFactory>;
	let boardNodeAuthorizableService: DeepMocked<BoardNodeAuthorizableService>;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				MediaBoardUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: BoardNodeAuthorizableService,
					useValue: createMock<BoardNodeAuthorizableService>(),
				},
				{
					provide: BoardNodeRule,
					useValue: createMock<BoardNodeRule>(),
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
					provide: BOARD_CONFIG_TOKEN,
					useValue: new BoardConfig(),
				},
				{
					provide: MediaBoardNodeFactory,
					useValue: createMock<MediaBoardNodeFactory>(),
				},
			],
		}).compile();

		uc = module.get(MediaBoardUc);
		authorizationService = module.get(AuthorizationService);
		userService = module.get(UserService);
		mediaBoardService = module.get(MediaBoardService);
		boardNodeRule = module.get(BoardNodeRule);
		boardNodeService = module.get(BoardNodeService);
		config = module.get(BOARD_CONFIG_TOKEN);
		boardNodeAuthorizableService = module.get(BoardNodeAuthorizableService);
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
				const user = userFactory.build();
				const userDo = userDoFactory.build();
				const mediaBoard = mediaBoardFactory.build();

				config.featureMediaShelfEnabled = true;
				userService.findById.mockResolvedValueOnce(userDo);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaBoardService.findByExternalReference.mockResolvedValueOnce([]);
				mediaBoardNodeFactory.buildMediaBoard.mockReturnValueOnce(mediaBoard);

				return {
					user,
					userDo,
					mediaBoard,
				};
			};

			it('should return a new media board', async () => {
				const { user, mediaBoard } = setup();
				mediaBoardService.getOrCreatePersonalMediaBoardOfUser.mockResolvedValueOnce(mediaBoard);

				const result = await uc.getMediaBoardForUser(user.id);

				expect(result).toEqual(mediaBoard);
			});
		});

		describe('when the user has a media board', () => {
			const setup = () => {
				const user = userFactory.build();
				const userDo = userDoFactory.build();
				const mediaBoard = mediaBoardFactory.build();

				config.featureMediaShelfEnabled = true;
				userService.findById.mockResolvedValueOnce(userDo);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaBoardService.findByExternalReference.mockResolvedValueOnce([mediaBoard]);

				return {
					user,
					userDo,
					mediaBoard,
				};
			};

			it('should return the existing media board', async () => {
				const { user, mediaBoard } = setup();
				mediaBoardService.getOrCreatePersonalMediaBoardOfUser.mockResolvedValueOnce(mediaBoard);

				const result = await uc.getMediaBoardForUser(user.id);

				expect(result).toEqual(mediaBoard);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userFactory.build();

				config.featureMediaShelfEnabled = false;

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
				const user = userFactory.build();
				const mediaBoard = mediaBoardFactory.build();
				const mediaLine = mediaLineFactory.build();

				config.featureMediaShelfEnabled = true;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
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
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					mediaBoard as unknown as BoardNodeAuthorizable
				);

				await uc.createLine(user.id, mediaBoard.id);

				expect(boardNodeRule.can).toHaveBeenCalledWith('createMediaBoardLine', user, mediaBoard);
			});

			it('should return a new media line', async () => {
				const { user, mediaBoard, mediaLine } = setup();
				boardNodeRule.can.mockReturnValueOnce(true);

				const result = await uc.createLine(user.id, mediaBoard.id);

				expect(result).toEqual(mediaLine);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userFactory.build();
				const mediaBoard = mediaBoardFactory.build();

				config.featureMediaShelfEnabled = false;

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
				const user = userFactory.build();
				const mediaBoard = mediaBoardFactory.build({
					layout: BoardLayout.LIST,
				});

				config.featureMediaShelfEnabled = true;
				boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaBoard);

				return {
					user,
					mediaBoard,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaBoard } = setup();
				boardNodeRule.can.mockReturnValueOnce(true);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					mediaBoard as unknown as BoardNodeAuthorizable
				);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				await uc.setLayout(user.id, mediaBoard.id, BoardLayout.GRID);

				expect(boardNodeRule.can).toHaveBeenCalledWith('updateMediaBoardLayout', user, mediaBoard);
			});

			it('should change the layout', async () => {
				const { user, mediaBoard } = setup();
				boardNodeRule.can.mockReturnValueOnce(true);

				await uc.setLayout(user.id, mediaBoard.id, BoardLayout.GRID);

				expect(mediaBoardService.updateLayout).toHaveBeenCalledWith(mediaBoard, BoardLayout.GRID);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userFactory.build();
				const mediaBoard = mediaBoardFactory.build();

				config.featureMediaShelfEnabled = false;

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
