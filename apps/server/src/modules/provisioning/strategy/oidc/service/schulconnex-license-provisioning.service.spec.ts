import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	MediaSource,
	mediaSourceFactory,
	MediaSourceService,
	MediaUserLicense,
	mediaUserLicenseFactory,
	UserLicenseService,
	UserLicenseType,
} from '@modules/user-license';
import { Test, TestingModule } from '@nestjs/testing';
import { User as UserEntity } from '@shared/domain/entity';
import { setupEntities, userFactory } from '@shared/testing';
import { ExternalLicenseDto } from '../../../dto';
import { SchulconnexLicenseProvisioningService } from './schulconnex-license-provisioning.service';

describe(SchulconnexLicenseProvisioningService.name, () => {
	let module: TestingModule;
	let service: SchulconnexLicenseProvisioningService;

	let userLicenseService: DeepMocked<UserLicenseService>;
	let mediaSourceService: DeepMocked<MediaSourceService>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				SchulconnexLicenseProvisioningService,
				{
					provide: UserLicenseService,
					useValue: createMock<UserLicenseService>(),
				},
				{
					provide: MediaSourceService,
					useValue: createMock<MediaSourceService>(),
				},
			],
		}).compile();

		service = module.get(SchulconnexLicenseProvisioningService);
		userLicenseService = module.get(UserLicenseService);
		mediaSourceService = module.get(MediaSourceService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('provisionExternalLicenses', () => {
		describe('when no external licenses are provided', () => {
			it('should not call services', async () => {
				await service.provisionExternalLicenses('userId', undefined);

				expect(userLicenseService.getMediaUserLicensesForUser).not.toHaveBeenCalled();
				expect(userLicenseService.saveUserLicense).not.toHaveBeenCalled();
				expect(userLicenseService.deleteUserLicense).not.toHaveBeenCalled();
			});
		});

		describe('when new external licenses are provided', () => {
			const setup = () => {
				const user: UserEntity = userFactory.build();

				const newExternalLicense1: ExternalLicenseDto = {
					mediumId: 'newMediumId',
					mediaSourceId: 'newMediaSourceId',
				};
				const newExternalLicense2: ExternalLicenseDto = {
					mediumId: 'newMediumId',
				};
				const existingExternalLicense: ExternalLicenseDto = {
					mediumId: 'existingMediumId',
					mediaSourceId: 'existingMediaSourceId',
				};
				const externalLicenses: ExternalLicenseDto[] = [
					newExternalLicense1,
					newExternalLicense2,
					existingExternalLicense,
				];

				const mediaSource: MediaSource = mediaSourceFactory.build({
					sourceId: 'existingMediaSourceId',
				});
				const existingMediaUserLicense: MediaUserLicense = mediaUserLicenseFactory.build({
					mediumId: existingExternalLicense.mediumId,
					mediaSource,
					userId: user.id,
				});

				userLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([existingMediaUserLicense]);
				mediaSourceService.findBySourceId.mockResolvedValueOnce(null);

				return {
					user,
					externalLicenses,
					newExternalLicense1,
					newExternalLicense2,
				};
			};

			it('should provision new licenses', async () => {
				const { user, externalLicenses, newExternalLicense1, newExternalLicense2 } = setup();

				await service.provisionExternalLicenses(user.id, externalLicenses);

				expect(userLicenseService.saveUserLicense).toHaveBeenCalledWith(
					new MediaUserLicense({
						id: expect.any(String),
						type: UserLicenseType.MEDIA_LICENSE,
						userId: user.id,
						mediumId: newExternalLicense1.mediumId,
						mediaSource: new MediaSource({
							id: expect.any(String),
							sourceId: newExternalLicense1.mediaSourceId as string,
						}),
					})
				);
				expect(userLicenseService.saveUserLicense).toHaveBeenCalledWith(
					new MediaUserLicense({
						id: expect.any(String),
						type: UserLicenseType.MEDIA_LICENSE,
						userId: user.id,
						mediumId: newExternalLicense2.mediumId,
						mediaSource: undefined,
					})
				);
			});
		});

		describe('when a license is expired', () => {
			const setup = () => {
				const user: UserEntity = userFactory.build();

				const activeExternalLicense: ExternalLicenseDto = {
					mediumId: 'activeMediumId',
					mediaSourceId: 'mediaSourceId',
				};

				const mediaSource: MediaSource = mediaSourceFactory.build({
					sourceId: 'mediaSourceId',
				});
				const expiredMediaUserLicense: MediaUserLicense = mediaUserLicenseFactory.build({
					userId: user.id,
					mediumId: 'expiredMediumId',
					mediaSource,
				});
				const activeMediaUserLicense: MediaUserLicense = mediaUserLicenseFactory.build({
					userId: user.id,
					mediumId: 'activeMediumId',
					mediaSource,
				});

				userLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([
					activeMediaUserLicense,
					expiredMediaUserLicense,
				]);

				return {
					user,
					expiredMediaUserLicense,
					activeExternalLicense,
					activeMediaUserLicense,
				};
			};

			it('should delete the expired license', async () => {
				const { user, expiredMediaUserLicense, activeExternalLicense } = setup();

				await service.provisionExternalLicenses(user.id, [activeExternalLicense]);

				expect(userLicenseService.deleteUserLicense).toHaveBeenCalledWith(expiredMediaUserLicense);
			});

			it('should not delete active licenses', async () => {
				const { user, activeExternalLicense, activeMediaUserLicense } = setup();

				await service.provisionExternalLicenses(user.id, [activeExternalLicense]);

				expect(userLicenseService.deleteUserLicense).not.toHaveBeenCalledWith(activeMediaUserLicense);
			});
		});
	});
});
