import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MediaUserLicense, mediaUserLicenseFactory, UserLicenseService, UserLicenseType } from '@modules/user-license';
import { Test, TestingModule } from '@nestjs/testing';
import { User as UserEntity } from '@shared/domain/entity';
import { setupEntities, userFactory } from '@shared/testing';
import { ExternalLicenseDto } from '../../../dto';
import { SchulconnexLicenseProvisioningService } from './schulconnex-license-provisioning.service';

describe(SchulconnexLicenseProvisioningService.name, () => {
	let module: TestingModule;
	let service: SchulconnexLicenseProvisioningService;

	let userLicenseService: DeepMocked<UserLicenseService>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				SchulconnexLicenseProvisioningService,
				{
					provide: UserLicenseService,
					useValue: createMock<UserLicenseService>(),
				},
			],
		}).compile();

		service = module.get(SchulconnexLicenseProvisioningService);
		userLicenseService = module.get(UserLicenseService);
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

				const newExternalLicense: ExternalLicenseDto = {
					mediumId: 'newMediumId',
					mediaSourceId: 'nMediaSourceId',
				};
				const existingExternalLicense: ExternalLicenseDto = {
					mediumId: 'existingMediumId',
					mediaSourceId: 'existingMediaSourceId',
				};
				const externalLicenses: ExternalLicenseDto[] = [newExternalLicense];

				const existingMediaUserLicenses: MediaUserLicense[] = mediaUserLicenseFactory.buildList(1, {
					mediumId: existingExternalLicense.mediumId,
					mediaSourceId: existingExternalLicense.mediaSourceId,
				});

				userLicenseService.getMediaUserLicensesForUser.mockResolvedValue(existingMediaUserLicenses);

				return { user, externalLicenses, newExternalLicense };
			};

			it('should provision new licenses', async () => {
				const { user, externalLicenses, newExternalLicense } = setup();

				await service.provisionExternalLicenses(user.id, externalLicenses);

				expect(userLicenseService.saveUserLicense).toHaveBeenCalledWith(
					expect.objectContaining({
						id: expect.any(String),
						type: UserLicenseType.MEDIA_LICENSE,
						userId: user.id,
						mediumId: newExternalLicense.mediumId,
						mediaSourceId: newExternalLicense.mediaSourceId,
					})
				);
			});
		});

		describe('when a license is expired', () => {
			const setup = () => {
				const user: UserEntity = userFactory.build();

				const activeExternalLicense: ExternalLicenseDto = {
					mediumId: 'activeMediumId',
					mediaSourceId: 'activeMediaSourceId',
				};

				const existingMediaUserLicenses: MediaUserLicense[] = mediaUserLicenseFactory.buildList(1, {
					mediumId: 'toDeleteMediumId',
					mediaSourceId: 'toDeleteMediaSourceId',
				});

				userLicenseService.getMediaUserLicensesForUser.mockResolvedValue(existingMediaUserLicenses);

				return { user, existingMediaUserLicense: existingMediaUserLicenses[0], activeExternalLicense };
			};

			it('should delete the expired license', async () => {
				const { user, existingMediaUserLicense } = setup();

				await service.provisionExternalLicenses(user.id, []);

				expect(userLicenseService.deleteUserLicense).toHaveBeenCalledWith(
					expect.objectContaining({
						id: existingMediaUserLicense.id,
						type: existingMediaUserLicense.type,
						userId: existingMediaUserLicense.userId,
						mediumId: existingMediaUserLicense.mediumId,
						mediaSourceId: existingMediaUserLicense.mediaSourceId,
					})
				);
			});

			it('should not delete active licenses', async () => {
				const { user, activeExternalLicense } = setup();

				await service.provisionExternalLicenses(user.id, [activeExternalLicense]);

				expect(userLicenseService.deleteUserLicense).not.toHaveBeenCalledWith(
					expect.objectContaining({
						mediumId: activeExternalLicense.mediumId,
						mediaSourceId: activeExternalLicense.mediaSourceId,
					})
				);
			});
		});
	});
});
