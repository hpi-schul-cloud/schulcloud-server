import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { mediaBoardFactory, mediaLineFactory, setupEntities, userFactory as userEntityFactory } from '@shared/testing';
import type { MediaBoardConfig } from '../../media-board.config';
import { MediaBoardService, MediaLineService } from '../../service';
import { MediaLineUc } from './media-line.uc';

describe(MediaLineUc.name, () => {
	let module: TestingModule;
	let uc: MediaLineUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let mediaBoardService: DeepMocked<MediaBoardService>;
	let mediaLineService: DeepMocked<MediaLineService>;
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
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		uc = module.get(MediaLineUc);
		authorizationService = module.get(AuthorizationService);
		mediaBoardService = module.get(MediaBoardService);
		mediaLineService = module.get(MediaLineService);
		configService = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('createLine', () => {
		describe('when the user creates a new media line', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaBoard = mediaBoardFactory.build();
				const mediaLine = mediaLineFactory.build();

				configService.get.mockReturnValueOnce(true);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaBoardService.findById.mockResolvedValueOnce(mediaBoard);
				mediaLineService.create.mockResolvedValueOnce(mediaLine);

				return {
					user,
					mediaBoard,
					mediaLine,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaBoard } = setup();

				await uc.createLine(user.id, mediaBoard.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					user,
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

	describe('moveLine', () => {
		describe('when the user moves a media line', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaBoard = mediaBoardFactory.build();
				const mediaLine = mediaLineFactory.build();

				configService.get.mockReturnValueOnce(true);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
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

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					user,
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

				configService.get.mockReturnValueOnce(true);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaLineService.findById.mockResolvedValueOnce(mediaLine);

				return {
					user,
					mediaLine,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaLine } = setup();

				await uc.updateLineTitle(user.id, mediaLine.id, 'newTitle');

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					user,
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

	describe('updateLineTitle', () => {
		describe('when the user deletes a media line', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaLine = mediaLineFactory.build();

				configService.get.mockReturnValueOnce(true);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaLineService.findById.mockResolvedValueOnce(mediaLine);

				return {
					user,
					mediaLine,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaLine } = setup();

				await uc.deleteLine(user.id, mediaLine.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					user,
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
});
