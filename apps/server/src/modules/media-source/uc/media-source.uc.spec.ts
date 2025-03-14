import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { MediaSource } from '../do';
import { MediaSourceService } from '../service';
import { mediaSourceFactory } from '../testing';
import { MediaSourceUc } from './media-source.uc';

describe(MediaSourceUc.name, () => {
	let module: TestingModule;
	let uc: MediaSourceUc;

	let mediaSourceService: DeepMocked<MediaSourceService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				MediaSourceUc,
				{
					provide: MediaSourceService,
					useValue: createMock<MediaSourceService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get(MediaSourceUc);
		mediaSourceService = module.get(MediaSourceService);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getAllMediaSources', () => {
		describe('when checking user permission', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const currentUser = currentUserFactory.build();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
					currentUser,
				};
			};
			it('should call getUserWithPermissions', async () => {
				const { currentUser } = setup();

				await uc.getMediaSourceList(currentUser.userId);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should call checkAllPermissions', async () => {
				const { currentUser, user } = setup();

				await uc.getMediaSourceList(currentUser.userId);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.MEDIA_SOURCE_ADMIN]);
			});

			it('should throw UnauthorizedException', async () => {
				const { currentUser } = setup();
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<MediaSource[]> = uc.getMediaSourceList(currentUser.userId);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when media sources are available', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const currentUser = currentUserFactory.build();
				const mediaSources: MediaSource[] = mediaSourceFactory.buildList(10);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaSourceService.getAllMediaSources.mockResolvedValueOnce(mediaSources);

				return {
					user,
					currentUser,
					mediaSources,
				};
			};

			it('should return a list of media sources', async () => {
				const { currentUser, mediaSources } = setup();

				const result = await uc.getMediaSourceList(currentUser.userId);

				expect(result).toEqual(mediaSources);
			});
		});

		describe('when no media sources are available', () => {
			const setup = () => {
				const mediaSources: MediaSource[] = [];
				const user: User = userFactory.buildWithId();
				const currentUser = currentUserFactory.build();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaSourceService.getAllMediaSources.mockResolvedValueOnce(mediaSources);

				return {
					user,
					currentUser,
					mediaSources,
				};
			};

			it('should return an empty list', async () => {
				const { currentUser, mediaSources } = setup();

				const result = await uc.getMediaSourceList(currentUser.userId);

				expect(result).toEqual(mediaSources);
			});
		});
	});
});
