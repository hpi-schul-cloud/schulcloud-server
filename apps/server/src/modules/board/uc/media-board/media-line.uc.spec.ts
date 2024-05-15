import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Action } from '@modules/authorization';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { setupEntities, userFactory as userEntityFactory } from '@shared/testing';
import type { MediaBoardConfig } from '../../media-board.config';
import { BoardNodeAuthorizableService, BoardNodePermissionService, MediaBoardService } from '../../service';
import { mediaBoardFactory, mediaLineFactory } from '../../testing';
import { MediaLineUc } from './media-line.uc';

describe(MediaLineUc.name, () => {
	let module: TestingModule;
	let uc: MediaLineUc;

	let mediaBoardService: DeepMocked<MediaBoardService>;
	let mediaLineService: DeepMocked<MediaLineService>;
	let boardNodePermissionService: DeepMocked<BoardNodePermissionService>;
	let configService: DeepMocked<ConfigService<MediaBoardConfig, true>>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				MediaLineUc,
				{
					provide: MediaBoardService,
					useValue: createMock<MediaBoardService>(),
				},
				{
					provide: MediaLineService,
					useValue: createMock<MediaLineService>(),
				},
				{
					provide: BoardNodeAuthorizableService,
					useValue: createMock<BoardNodeAuthorizableService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		uc = module.get(MediaLineUc);
		mediaBoardService = module.get(MediaBoardService);
		mediaLineService = module.get(MediaLineService);
		boardNodePermissionService = module.get(BoardNodePermissionService);
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

				configService.get.mockReturnValueOnce(true);
				mediaBoardService.findById.mockResolvedValueOnce(mediaBoard);
				mediaLineService.findById.mockResolvedValueOnce(mediaLine);

				return {
					user,
					mediaBoard,
					mediaLine,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaLine, mediaBoard } = setup();

				await uc.moveLine(user.id, mediaLine.id, mediaBoard.id, 1);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, mediaBoard, Action.write);
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

				configService.get.mockReturnValueOnce(true);

				mediaLineService.findById.mockResolvedValueOnce(mediaLine);

				return {
					user,
					mediaLine,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaLine } = setup();

				await uc.updateLineTitle(user.id, mediaLine.id, 'newTitle');

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user, mediaLine, Action.write);
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

	describe('updateLineTitle', () => {
		describe('when the user deletes a media line', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaLine = mediaLineFactory.build();

				configService.get.mockReturnValueOnce(true);
				mediaLineService.findById.mockResolvedValueOnce(mediaLine);

				return { user, mediaLine };
			};

			it('should check the authorization', async () => {
				const { user, mediaLine } = setup();

				await uc.deleteLine(user.id, mediaLine.id);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user, mediaLine, Action.write);
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
});
