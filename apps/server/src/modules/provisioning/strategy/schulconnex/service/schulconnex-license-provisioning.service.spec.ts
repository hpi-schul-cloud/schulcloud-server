import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { LegacyLogger } from '@infra/logger';
import { GroupService } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { GroupLicenseType, MediaGroupLicenseService } from '@modules/group-license';
import { mediaGroupLicenseFactory } from '@modules/group-license/testing';
import { LegacySchoolService } from '@modules/legacy-school';
import { legacySchoolDoFactory } from '@modules/legacy-school/testing';
import { MediaSource, MediaSourceService } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediaSchoolLicense, MediaSchoolLicenseService, SchoolLicenseType } from '@modules/school-license';
import { MediaUserLicense, MediaUserLicenseService, UserLicenseType } from '@modules/user-license';
import { mediaUserLicenseFactory } from '@modules/user-license/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, type TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ExternalLicenseDto } from '../../../dto';
import { PROVISIONING_CONFIG_TOKEN, type ProvisioningConfig } from '../../../provisioning.config';
import { SchulconnexLicenseProvisioningService } from './schulconnex-license-provisioning.service';

describe(SchulconnexLicenseProvisioningService.name, () => {
	let module: TestingModule;
	let service: SchulconnexLicenseProvisioningService;

	let mediaUserLicenseService: DeepMocked<MediaUserLicenseService>;
	let mediaSourceService: DeepMocked<MediaSourceService>;
	let mediaSchoolLicenseService: DeepMocked<MediaSchoolLicenseService>;
	let mediaGroupLicenseService: DeepMocked<MediaGroupLicenseService>;
	let groupService: DeepMocked<GroupService>;
	let schoolService: DeepMocked<LegacySchoolService>;
	let logger: DeepMocked<LegacyLogger>;
	let config: ProvisioningConfig;

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
				{
					provide: MediaSchoolLicenseService,
					useValue: createMock<MediaSchoolLicenseService>(),
				},
				{
					provide: MediaGroupLicenseService,
					useValue: createMock<MediaGroupLicenseService>(),
				},
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: PROVISIONING_CONFIG_TOKEN,
					useValue: { featureSchulconnexGroupSchoolMediaLicenseEnabled: true },
				},
			],
		}).compile();

		service = module.get(SchulconnexLicenseProvisioningService);
		mediaUserLicenseService = module.get(MediaUserLicenseService);
		mediaSourceService = module.get(MediaSourceService);
		mediaSchoolLicenseService = module.get(MediaSchoolLicenseService);
		mediaGroupLicenseService = module.get(MediaGroupLicenseService);
		groupService = module.get(GroupService);
		schoolService = module.get(LegacySchoolService);
		logger = module.get(LegacyLogger);
		config = module.get(PROVISIONING_CONFIG_TOKEN);
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

				const newExternalLicense1: ExternalLicenseDto = new ExternalLicenseDto({
					mediumId: 'medium1',
					mediaSourceId: 'newMediaSourceId',
				});
				const newExternalLicense2: ExternalLicenseDto = new ExternalLicenseDto({
					mediumId: 'medium2',
					mediaSourceId: 'existingMediaSourceId',
				});
				const newExternalLicense3: ExternalLicenseDto = new ExternalLicenseDto({
					mediumId: 'medium3',
				});
				const existingExternalLicense: ExternalLicenseDto = new ExternalLicenseDto({
					mediumId: 'medium4',
					mediaSourceId: 'existingMediaSourceId',
				});
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

				const activeExternalLicense: ExternalLicenseDto = new ExternalLicenseDto({
					mediumId: 'activeMediumId',
					mediaSourceId: 'mediaSourceId',
				});

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

		describe('when school licenses are provided', () => {
			const userId = 'user-1';
			const systemId = 'system-1';
			const externalSchoolId = 'school-uuid';
			const schoolId = 'internal-school-1';

			const setupSchool = () => {
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);
				schoolService.getSchoolById.mockResolvedValueOnce(
					legacySchoolDoFactory.build({ id: schoolId, externalId: externalSchoolId })
				);
			};

			it('should provision new licenses for the own school and skip existing ones', async () => {
				setupSchool();

				const existingLicense = new MediaSchoolLicense({
					id: 'lic-1',
					type: SchoolLicenseType.MEDIA_LICENSE,
					schoolId,
					mediumId: 'med-existing',
				});
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([existingLicense]);

				const schoolLicenses: ExternalLicenseDto[] = [
					new ExternalLicenseDto({ scope: 'SCHOOL', scopeId: externalSchoolId, mediumId: 'med-existing' }),
					new ExternalLicenseDto({
						scope: 'SCHOOL',
						scopeId: externalSchoolId,
						mediumId: 'med-new',
						mediaSourceId: 'src-1',
					}),
				];

				await service.provisionExternalLicenses(userId, schoolLicenses, schoolId, systemId);

				expect(schoolService.getSchoolById).toHaveBeenCalledWith(schoolId);
				expect(mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId).toHaveBeenCalledWith(schoolId);
				expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).toHaveBeenCalledWith([
					expect.objectContaining({
						props: expect.objectContaining({
							type: SchoolLicenseType.MEDIA_LICENSE,
							schoolId,
							mediumId: 'med-new',
						}),
					}),
				]);
			});

			it('should ignore licenses for an organisation other than the own school', async () => {
				setupSchool();

				const schoolLicenses: ExternalLicenseDto[] = [
					new ExternalLicenseDto({ scope: 'SCHOOL', scopeId: 'other-school-uuid', mediumId: 'med-1' }),
				];

				await service.provisionExternalLicenses(userId, schoolLicenses, schoolId, systemId);

				expect(mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId).not.toHaveBeenCalled();
				expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).not.toHaveBeenCalled();
			});

			it('should ignore school licenses when the own school has no external id', async () => {
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);
				const school = legacySchoolDoFactory.build({ id: schoolId });
				school.externalId = undefined;
				schoolService.getSchoolById.mockResolvedValueOnce(school);

				const schoolLicenses: ExternalLicenseDto[] = [
					new ExternalLicenseDto({ scope: 'SCHOOL', scopeId: externalSchoolId, mediumId: 'med-1' }),
				];

				await service.provisionExternalLicenses(userId, schoolLicenses, schoolId, systemId);

				expect(mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId).not.toHaveBeenCalled();
				expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).not.toHaveBeenCalled();
				expect(logger.warn).toHaveBeenCalledWith(
					`Skipping ${schoolLicenses.length} school media licenses for school ${schoolId}: school has no external ID.`
				);
			});

			it('should provision school license without mediaSourceId', async () => {
				setupSchool();
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);

				const schoolLicenses: ExternalLicenseDto[] = [
					new ExternalLicenseDto({ scope: 'SCHOOL', scopeId: externalSchoolId, mediumId: 'med-no-source' }),
				];

				await service.provisionExternalLicenses(userId, schoolLicenses, schoolId, systemId);

				expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).toHaveBeenCalledWith([
					expect.objectContaining({
						props: expect.objectContaining({ mediumId: 'med-no-source', mediaSource: undefined }),
					}),
				]);
			});

			it('should not call save when all school licenses already exist', async () => {
				setupSchool();

				const existingLicense = new MediaSchoolLicense({
					id: 'lic-1',
					type: SchoolLicenseType.MEDIA_LICENSE,
					schoolId,
					mediumId: 'med-existing',
				});
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([existingLicense]);

				const schoolLicenses: ExternalLicenseDto[] = [
					new ExternalLicenseDto({ scope: 'SCHOOL', scopeId: externalSchoolId, mediumId: 'med-existing' }),
				];

				await service.provisionExternalLicenses(userId, schoolLicenses, schoolId, systemId);

				expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).not.toHaveBeenCalled();
			});

			it('should not delete existing school licenses that are missing in the response', async () => {
				setupSchool();

				const existingLicense = new MediaSchoolLicense({
					id: 'lic-existing',
					type: SchoolLicenseType.MEDIA_LICENSE,
					schoolId,
					mediaSource: mediaSourceFactory.build({ sourceId: 'src-1' }),
					mediumId: 'med-missing',
				});
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([existingLicense]);

				const schoolLicenses: ExternalLicenseDto[] = [
					new ExternalLicenseDto({
						scope: 'SCHOOL',
						scopeId: externalSchoolId,
						mediumId: 'med-new',
						mediaSourceId: 'src-1',
					}),
				];

				await service.provisionExternalLicenses(userId, schoolLicenses, schoolId, systemId);

				expect(mediaSchoolLicenseService.deleteAllBySchoolAndMediaSource).not.toHaveBeenCalled();
				expect(mediaSchoolLicenseService.deleteAllByMediaSource).not.toHaveBeenCalled();
				expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).toHaveBeenCalledWith([
					expect.objectContaining({ props: expect.objectContaining({ mediumId: 'med-new' }) }),
				]);
			});
		});

		describe('when the group and school media license feature is disabled', () => {
			afterEach(() => {
				config.featureSchulconnexGroupSchoolMediaLicenseEnabled = true;
			});

			it('should only provision user licenses', async () => {
				config.featureSchulconnexGroupSchoolMediaLicenseEnabled = false;
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);

				const licenses: ExternalLicenseDto[] = [
					new ExternalLicenseDto({ scope: 'USER', mediumId: 'med-user' }),
					new ExternalLicenseDto({ scope: 'SCHOOL', scopeId: 'school-uuid', mediumId: 'med-school' }),
					new ExternalLicenseDto({ scope: 'GROUP', scopeId: 'group-uuid', mediumId: 'med-group' }),
				];

				await service.provisionExternalLicenses('user-1', licenses, 'school-1', 'system-1');

				expect(mediaUserLicenseService.saveAll).toHaveBeenCalledWith([
					expect.objectContaining({ props: expect.objectContaining({ mediumId: 'med-user' }) }),
				]);
				expect(schoolService.getSchoolById).not.toHaveBeenCalled();
				expect(groupService.findByExternalSource).not.toHaveBeenCalled();
				expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).not.toHaveBeenCalled();
				expect(mediaGroupLicenseService.saveAll).not.toHaveBeenCalled();
			});
		});

		describe('when group licenses are provided', () => {
			it('should resolve internal group and provision group licenses', async () => {
				const userId = 'user-1';
				const systemId = 'system-1';
				const externalGroupId = 'ext-group-uuid';
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);

				const group = groupFactory.build({ id: 'internal-group-1' });
				groupService.findByExternalSource.mockResolvedValueOnce(group);
				mediaGroupLicenseService.findMediaGroupLicensesByGroupId.mockResolvedValueOnce([]);

				const groupLicenses: ExternalLicenseDto[] = [
					new ExternalLicenseDto({
						scope: 'GROUP',
						scopeId: externalGroupId,
						mediumId: 'med-group-1',
						mediaSourceId: 'src-1',
					}),
				];

				await service.provisionExternalLicenses(userId, groupLicenses, 'school-1', systemId);

				expect(groupService.findByExternalSource).toHaveBeenCalledWith(externalGroupId, systemId);
				expect(mediaGroupLicenseService.saveAll).toHaveBeenCalledWith([
					expect.objectContaining({
						props: expect.objectContaining({
							type: GroupLicenseType.MEDIA_LICENSE,
							groupId: 'internal-group-1',
							mediumId: 'med-group-1',
						}),
					}),
				]);
			});

			it('should skip group licenses without a scopeId', async () => {
				const userId = 'user-1';
				const systemId = 'system-1';
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);

				const groupLicenses: ExternalLicenseDto[] = [
					new ExternalLicenseDto({
						scope: 'GROUP',
						mediumId: 'med-group-1',
						mediaSourceId: 'src-1',
					}),
				];

				await service.provisionExternalLicenses(userId, groupLicenses, 'school-1', systemId);

				expect(groupService.findByExternalSource).not.toHaveBeenCalled();
				expect(mediaGroupLicenseService.saveAll).not.toHaveBeenCalled();
			});

			it('should skip group licenses when the external group cannot be resolved', async () => {
				const userId = 'user-1';
				const systemId = 'system-1';
				const externalGroupId = 'unknown-ext-group';
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);
				groupService.findByExternalSource.mockResolvedValueOnce(null);

				const groupLicenses: ExternalLicenseDto[] = [
					new ExternalLicenseDto({
						scope: 'GROUP',
						scopeId: externalGroupId,
						mediumId: 'med-group-1',
						mediaSourceId: 'src-1',
					}),
				];

				await service.provisionExternalLicenses(userId, groupLicenses, 'school-1', systemId);

				expect(groupService.findByExternalSource).toHaveBeenCalledWith(externalGroupId, systemId);
				expect(mediaGroupLicenseService.saveAll).not.toHaveBeenCalled();
				expect(logger.warn).toHaveBeenCalledWith(
					`Skipping ${groupLicenses.length} group media licenses: group ${externalGroupId} is not provisioned for system ${systemId}.`
				);
			});

			it('should skip group licenses that already exist', async () => {
				const userId = 'user-1';
				const systemId = 'system-1';
				const externalGroupId = 'ext-group-uuid';
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);

				const group = groupFactory.build({ id: 'internal-group-1' });
				groupService.findByExternalSource.mockResolvedValueOnce(group);

				const existingLicense = mediaGroupLicenseFactory.build({
					groupId: group.id,
					mediumId: 'med-group-1',
					mediaSource: mediaSourceFactory.build({ sourceId: 'src-1' }),
				});
				mediaGroupLicenseService.findMediaGroupLicensesByGroupId.mockResolvedValueOnce([existingLicense]);

				const groupLicenses: ExternalLicenseDto[] = [
					new ExternalLicenseDto({
						scope: 'GROUP',
						scopeId: externalGroupId,
						mediumId: 'med-group-1',
						mediaSourceId: 'src-1',
					}),
				];

				await service.provisionExternalLicenses(userId, groupLicenses, 'school-1', systemId);

				expect(mediaGroupLicenseService.saveAll).not.toHaveBeenCalled();
			});

			it('should provision group license without mediaSourceId', async () => {
				const userId = 'user-1';
				const systemId = 'system-1';
				const externalGroupId = 'ext-group-uuid';
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);

				const group = groupFactory.build({ id: 'internal-group-1' });
				groupService.findByExternalSource.mockResolvedValueOnce(group);
				mediaGroupLicenseService.findMediaGroupLicensesByGroupId.mockResolvedValueOnce([]);

				const groupLicenses: ExternalLicenseDto[] = [
					new ExternalLicenseDto({ scope: 'GROUP', scopeId: externalGroupId, mediumId: 'med-no-source' }),
				];

				await service.provisionExternalLicenses(userId, groupLicenses, 'school-1', systemId);

				expect(mediaGroupLicenseService.saveAll).toHaveBeenCalledWith([
					expect.objectContaining({
						props: expect.objectContaining({ mediumId: 'med-no-source', mediaSource: undefined }),
					}),
				]);
			});

			it('should not delete existing group licenses that are missing in the response', async () => {
				const userId = 'user-1';
				const systemId = 'system-1';
				const externalGroupId = 'ext-group-uuid';
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);

				const group = groupFactory.build({ id: 'internal-group-1' });
				groupService.findByExternalSource.mockResolvedValueOnce(group);

				const existingLicense = mediaGroupLicenseFactory.build({
					groupId: group.id,
					mediumId: 'med-missing',
				});
				mediaGroupLicenseService.findMediaGroupLicensesByGroupId.mockResolvedValueOnce([existingLicense]);

				const groupLicenses: ExternalLicenseDto[] = [
					new ExternalLicenseDto({ scope: 'GROUP', scopeId: externalGroupId, mediumId: 'med-new' }),
				];

				await service.provisionExternalLicenses(userId, groupLicenses, 'school-1', systemId);

				expect(mediaGroupLicenseService.delete).not.toHaveBeenCalled();
				expect(mediaGroupLicenseService.saveAll).toHaveBeenCalledWith([
					expect.objectContaining({ props: expect.objectContaining({ mediumId: 'med-new' }) }),
				]);
			});
		});
	});

	describe('when school or group licenses have no scopeId', () => {
		it('should skip school license provisioning when no scopeId is present', async () => {
			mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);
			schoolService.getSchoolById.mockResolvedValueOnce(
				legacySchoolDoFactory.build({ id: 'school-1', externalId: 'school-uuid' })
			);

			await expect(
				service.provisionExternalLicenses(
					'user-1',
					[new ExternalLicenseDto({ scope: 'SCHOOL', mediumId: 'med-1' })],
					'school-1',
					'system-1'
				)
			).resolves.not.toThrow();

			expect(mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId).not.toHaveBeenCalled();
		});

		it('should skip school license provisioning when no school id is given', async () => {
			mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);

			await service.provisionExternalLicenses(
				'user-1',
				[new ExternalLicenseDto({ scope: 'SCHOOL', scopeId: 'school-uuid', mediumId: 'med-1' })],
				undefined,
				'system-1'
			);

			expect(schoolService.getSchoolById).not.toHaveBeenCalled();
			expect(mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId).not.toHaveBeenCalled();
		});

		it('should skip group license provisioning when no scopeId is present', async () => {
			mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);

			await expect(
				service.provisionExternalLicenses(
					'user-1',
					[new ExternalLicenseDto({ scope: 'GROUP', mediumId: 'med-1' })],
					'school-1',
					'system-1'
				)
			).resolves.not.toThrow();

			expect(groupService.findByExternalSource).not.toHaveBeenCalled();
		});
	});
});
