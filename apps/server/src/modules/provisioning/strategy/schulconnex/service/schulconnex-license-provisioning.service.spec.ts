import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MediaSource, MediaSourceService } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediaUserLicense, MediaUserLicenseService, UserLicenseType } from '@modules/user-license';
import { mediaUserLicenseFactory } from '@modules/user-license/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ExternalLicenseDto } from '../../../dto';
import { SchulconnexLicenseProvisioningService } from './schulconnex-license-provisioning.service';

describe(SchulconnexLicenseProvisioningService.name, () => {
	let module: TestingModule;
	let service: SchulconnexLicenseProvisioningService;

	let mediaUserLicenseService: DeepMocked<MediaUserLicenseService>;
	let mediaSourceService: DeepMocked<MediaSourceService>;

	beforeAll(async () => {
		await setupEntities([User]);
		module = await Test.createTestingModule({
			providers: [
				SchulconnexLicenseProvisioningService,
				{
					provide: MediaUserLicenseService,
					useValue: createMock<MediaUserLicenseService>(),
				},
				{
					provide: MediaSourceService,
					useValue: createMock<MediaSourceService>(),
				},
			],
		}).compile();

		service = module.get(SchulconnexLicenseProvisioningService);
		mediaUserLicenseService = module.get(MediaUserLicenseService);
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

				expect(mediaUserLicenseService.saveAll).not.toHaveBeenCalled();
				expect(mediaSourceService.saveAll).not.toHaveBeenCalled();
				expect(mediaUserLicenseService.delete).not.toHaveBeenCalled();
			});
		});

		describe('when new external licenses are provided', () => {
			const setup = () => {
				const user: User = userFactory.build();

				const newExternalLicense1: ExternalLicenseDto = {
					mediumId: 'medium1',
					mediaSourceId: 'newMediaSourceId',
				};
				const newExternalLicense2: ExternalLicenseDto = {
					mediumId: 'medium2',
					mediaSourceId: 'existingMediaSourceId',
				};
				const newExternalLicense3: ExternalLicenseDto = {
					mediumId: 'medium3',
				};
				const existingExternalLicense: ExternalLicenseDto = {
					mediumId: 'medium4',
					mediaSourceId: 'existingMediaSourceId',
				};
				const externalLicenses: ExternalLicenseDto[] = [
					newExternalLicense1,
					newExternalLicense2,
					newExternalLicense3,
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

				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([existingMediaUserLicense]);
				mediaSourceService.findBySourceId.mockResolvedValueOnce(null);
				mediaSourceService.findBySourceId.mockResolvedValueOnce(mediaSource);

				return {
					user,
					externalLicenses,
					newExternalLicense1,
					newExternalLicense2,
					newExternalLicense3,
					mediaSource,
				};
			};

			it('should provision new media sources', async () => {
				const { user, externalLicenses, newExternalLicense1 } = setup();

				await service.provisionExternalLicenses(user.id, externalLicenses);

				expect(mediaSourceService.saveAll).toHaveBeenCalledWith([
					new MediaSource({
						id: expect.any(String),
						sourceId: newExternalLicense1.mediaSourceId as string,
					}),
				]);
			});

			it('should provision new licenses', async () => {
				const { user, externalLicenses, newExternalLicense1, newExternalLicense2, newExternalLicense3, mediaSource } =
					setup();

				await service.provisionExternalLicenses(user.id, externalLicenses);

				expect(mediaUserLicenseService.saveAll).toHaveBeenCalledWith([
					new MediaUserLicense({
						id: expect.any(String),
						type: UserLicenseType.MEDIA_LICENSE,
						userId: user.id,
						mediumId: newExternalLicense1.mediumId,
						mediaSource: new MediaSource({
							id: expect.any(String),
							sourceId: newExternalLicense1.mediaSourceId as string,
						}),
					}),
					new MediaUserLicense({
						id: expect.any(String),
						type: UserLicenseType.MEDIA_LICENSE,
						userId: user.id,
						mediumId: newExternalLicense2.mediumId,
						mediaSource,
					}),
					new MediaUserLicense({
						id: expect.any(String),
						type: UserLicenseType.MEDIA_LICENSE,
						userId: user.id,
						mediumId: newExternalLicense3.mediumId,
						mediaSource: undefined,
					}),
				]);
			});
		});

		describe('when a license is expired', () => {
			const setup = () => {
				const user: User = userFactory.build();

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

				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([
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

				expect(mediaUserLicenseService.delete).toHaveBeenCalledWith([expiredMediaUserLicense]);
			});
		});
	});
});
