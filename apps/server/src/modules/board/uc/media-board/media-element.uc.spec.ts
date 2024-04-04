import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import {
	mediaExternalToolElementFactory,
	mediaLineFactory,
	setupEntities,
	userFactory as userEntityFactory,
} from '@shared/testing';
import type { MediaBoardConfig } from '../../media-board.config';
import { MediaElementService, MediaLineService } from '../../service';
import { MediaElementUc } from './media-element.uc';

describe(MediaElementUc.name, () => {
	let module: TestingModule;
	let uc: MediaElementUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let mediaLineService: DeepMocked<MediaLineService>;
	let mediaElementService: DeepMocked<MediaElementService>;
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
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		uc = module.get(MediaElementUc);
		authorizationService = module.get(AuthorizationService);
		mediaLineService = module.get(MediaLineService);
		mediaElementService = module.get(MediaElementService);
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

				configService.get.mockReturnValueOnce(true);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaLineService.findById.mockResolvedValueOnce(mediaLine);
				mediaElementService.findById.mockResolvedValueOnce(mediaElement);

				return {
					user,
					mediaElement,
					mediaLine,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaLine, mediaElement } = setup();

				await uc.moveElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					user,
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
