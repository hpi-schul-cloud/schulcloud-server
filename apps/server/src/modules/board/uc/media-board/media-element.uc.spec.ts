import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import {
	boardDoAuthorizableFactory,
	mediaExternalToolElementFactory,
	mediaLineFactory,
	setupEntities,
	userFactory as userEntityFactory,
} from '@shared/testing';
import type { MediaBoardConfig } from '../../media-board.config';
import { BoardDoAuthorizableService, MediaElementService, MediaLineService } from '../../service';
import { MediaElementUc } from './media-element.uc';

describe(MediaElementUc.name, () => {
	let module: TestingModule;
	let uc: MediaElementUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let mediaLineService: DeepMocked<MediaLineService>;
	let mediaElementService: DeepMocked<MediaElementService>;
	let boardDoAuthorizableService: DeepMocked<BoardDoAuthorizableService>;
	let configService: DeepMocked<ConfigService<MediaBoardConfig, true>>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				MediaElementUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: MediaLineService,
					useValue: createMock<MediaLineService>(),
				},
				{
					provide: MediaElementService,
					useValue: createMock<MediaElementService>(),
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

		uc = module.get(MediaElementUc);
		authorizationService = module.get(AuthorizationService);
		mediaLineService = module.get(MediaLineService);
		mediaElementService = module.get(MediaElementService);
		boardDoAuthorizableService = module.get(BoardDoAuthorizableService);
		configService = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('moveElement', () => {
		describe('when the user moves a media element', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaLine = mediaLineFactory.build();
				const mediaElement = mediaExternalToolElementFactory.build();
				const boardDoAuthorizable = boardDoAuthorizableFactory.build();

				configService.get.mockReturnValueOnce(true);
				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardDoAuthorizable);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaLineService.findById.mockResolvedValueOnce(mediaLine);
				mediaElementService.findById.mockResolvedValueOnce(mediaElement);

				return {
					user,
					mediaElement,
					mediaLine,
					boardDoAuthorizable,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaLine, mediaElement, boardDoAuthorizable } = setup();

				await uc.moveElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					boardDoAuthorizable,
					AuthorizationContextBuilder.write([])
				);
			});

			it('should move the element', async () => {
				const { user, mediaLine, mediaElement } = setup();

				await uc.moveElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(mediaElementService.move).toHaveBeenCalledWith(mediaElement, mediaLine, 1);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaLine = mediaLineFactory.build();
				const mediaElement = mediaExternalToolElementFactory.build();

				configService.get.mockReturnValueOnce(false);

				return {
					user,
					mediaElement,
					mediaLine,
				};
			};

			it('should throw an exception', async () => {
				const { user, mediaLine, mediaElement } = setup();

				await expect(uc.moveElement(user.id, mediaElement.id, mediaLine.id, 1)).rejects.toThrow(
					FeatureDisabledLoggableException
				);
			});
		});
	});
});
