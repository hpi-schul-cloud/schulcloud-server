import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { GroupService } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { GroupLicenseType, MediaGroupLicenseService } from '@modules/group-license';
import { mediaGroupLicenseFactory } from '@modules/group-license/testing';
import { MediaSource, MediaSourceService } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediaSchoolLicense, MediaSchoolLicenseService, SchoolLicenseType } from '@modules/school-license';
import { MediaUserLicense, MediaUserLicenseService, UserLicenseType } from '@modules/user-license';
import { mediaUserLicenseFactory } from '@modules/user-license/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, type TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { type ExternalLicenseDto } from '../../../dto';
import { SchulconnexLicenseProvisioningService } from './schulconnex-license-provisioning.service';

describe(SchulconnexLicenseProvisioningService.name, () => {
	let module: TestingModule;
	let service: SchulconnexLicenseProvisioningService;

	let mediaUserLicenseService: DeepMocked<MediaUserLicenseService>;
	let mediaSourceService: DeepMocked<MediaSourceService>;
	let mediaSchoolLicenseService: DeepMocked<MediaSchoolLicenseService>;
	let mediaGroupLicenseService: DeepMocked<MediaGroupLicenseService>;
	let groupService: DeepMocked<GroupService>;

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
			],
		}).compile();

		service = module.get(SchulconnexLicenseProvisioningService);
		mediaUserLicenseService = module.get(MediaUserLicenseService);
		mediaSourceService = module.get(MediaSourceService);
		mediaSchoolLicenseService = module.get(MediaSchoolLicenseService);
		mediaGroupLicenseService = module.get(MediaGroupLicenseService);
		groupService = module.get(GroupService);
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

		describe('when school licenses are provided', () => {
			it('should provision new school licenses and skip existing ones', async () => {
				const userId = 'user-1';
				const schoolId = 'school-1';
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);

				const existingLicense = new MediaSchoolLicense({
					id: 'lic-1',
					type: SchoolLicenseType.MEDIA_LICENSE,
					schoolId,
					mediumId: 'med-existing',
				});
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([existingLicense]);

				const schoolLicenses: ExternalLicenseDto[] = [
					{
						scope: 'SCHOOL',
						scopeId: 'school-uuid',
						mediumId: 'med-existing',
					},
					{
						scope: 'SCHOOL',
						scopeId: 'school-uuid',
						mediumId: 'med-new',
						mediaSourceId: 'src-1',
					},
				];

				await service.provisionExternalLicenses(userId, schoolLicenses, schoolId);

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

			it('should provision school license without mediaSourceId', async () => {
				const userId = 'user-1';
				const schoolId = 'school-1';
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);

				const schoolLicenses: ExternalLicenseDto[] = [
					{ scope: 'SCHOOL', scopeId: 'school-uuid', mediumId: 'med-no-source' },
				];

				await service.provisionExternalLicenses(userId, schoolLicenses, schoolId);

				expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).toHaveBeenCalledWith([
					expect.objectContaining({
						props: expect.objectContaining({ mediumId: 'med-no-source', mediaSource: undefined }),
					}),
				]);
			});

			it('should not call save when all school licenses already exist', async () => {
				const userId = 'user-1';
				const schoolId = 'school-1';
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);

				const existingLicense = new MediaSchoolLicense({
					id: 'lic-1',
					type: SchoolLicenseType.MEDIA_LICENSE,
					schoolId,
					mediumId: 'med-existing',
				});
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([existingLicense]);

				const schoolLicenses: ExternalLicenseDto[] = [
					{ scope: 'SCHOOL', scopeId: 'school-uuid', mediumId: 'med-existing' },
				];

				await service.provisionExternalLicenses(userId, schoolLicenses, schoolId);

				expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).not.toHaveBeenCalled();
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
					{
						scope: 'GROUP',
						scopeId: externalGroupId,
						mediumId: 'med-group-1',
						mediaSourceId: 'src-1',
					},
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
					{
						scope: 'GROUP',
						mediumId: 'med-group-1',
						mediaSourceId: 'src-1',
					},
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
					{
						scope: 'GROUP',
						scopeId: externalGroupId,
						mediumId: 'med-group-1',
						mediaSourceId: 'src-1',
					},
				];

				await service.provisionExternalLicenses(userId, groupLicenses, 'school-1', systemId);

				expect(groupService.findByExternalSource).toHaveBeenCalledWith(externalGroupId, systemId);
				expect(mediaGroupLicenseService.saveAll).not.toHaveBeenCalled();
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
					{
						scope: 'GROUP',
						scopeId: externalGroupId,
						mediumId: 'med-group-1',
						mediaSourceId: 'src-1',
					},
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
					{ scope: 'GROUP', scopeId: externalGroupId, mediumId: 'med-no-source' },
				];

				await service.provisionExternalLicenses(userId, groupLicenses, 'school-1', systemId);

				expect(mediaGroupLicenseService.saveAll).toHaveBeenCalledWith([
					expect.objectContaining({
						props: expect.objectContaining({ mediumId: 'med-no-source', mediaSource: undefined }),
					}),
				]);
			});
		});
	});

	describe('when optional services are not provided', () => {
		let serviceWithoutOptionals: SchulconnexLicenseProvisioningService;
		let minimalUserLicenseService: DeepMocked<MediaUserLicenseService>;
		let minimalModule: TestingModule;

		beforeAll(async () => {
			minimalModule = await Test.createTestingModule({
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

			serviceWithoutOptionals = minimalModule.get(SchulconnexLicenseProvisioningService);
			minimalUserLicenseService = minimalModule.get(MediaUserLicenseService);
		});

		afterAll(async () => {
			await minimalModule.close();
		});

		afterEach(() => {
			jest.resetAllMocks();
		});

		it('should skip school license provisioning when MediaSchoolLicenseService is absent', async () => {
			minimalUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);

			await expect(
				serviceWithoutOptionals.provisionExternalLicenses(
					'user-1',
					[{ scope: 'SCHOOL', scopeId: 'school-uuid', mediumId: 'med-1' }],
					'school-1'
				)
			).resolves.not.toThrow();
		});

		it('should skip group license provisioning when MediaGroupLicenseService is absent', async () => {
			minimalUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);

			await expect(
				serviceWithoutOptionals.provisionExternalLicenses(
					'user-1',
					[{ scope: 'GROUP', scopeId: 'ext-group-uuid', mediumId: 'med-1' }],
					'school-1',
					'system-1'
				)
			).resolves.not.toThrow();
		});
	});
});
