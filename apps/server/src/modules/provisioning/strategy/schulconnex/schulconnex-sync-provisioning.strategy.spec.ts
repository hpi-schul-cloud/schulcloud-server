import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchulconnexRestClient } from '@infra/schulconnex-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { GroupService } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { legacySchoolDoFactory } from '@modules/legacy-school/testing';
import { userDoFactory } from '@modules/user/testing';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ExternalSchoolDto, OauthDataDto, ProvisioningDto, ProvisioningSystemDto } from '../../dto';
import { ProvisioningConfig } from '../../provisioning.config';
import { externalGroupDtoFactory, externalSchoolDtoFactory, externalUserDtoFactory } from '../../testing';
import { SchulconnexResponseMapper } from './schulconnex-response-mapper';
import { SchulconnexSyncProvisioningStrategy } from './schulconnex-sync-provisioning.strategy';
import {
	SchulconnexCourseSyncService,
	SchulconnexGroupProvisioningService,
	SchulconnexLicenseProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexToolProvisioningService,
	SchulconnexUserProvisioningService,
} from './service';

describe(SchulconnexSyncProvisioningStrategy.name, () => {
	let module: TestingModule;
	let strategy: SchulconnexSyncProvisioningStrategy;

	let schulconnexSchoolProvisioningService: DeepMocked<SchulconnexSchoolProvisioningService>;
	let schulconnexUserProvisioningService: DeepMocked<SchulconnexUserProvisioningService>;
	let schulconnexGroupProvisioningService: DeepMocked<SchulconnexGroupProvisioningService>;
	let schulconnexCourseSyncService: DeepMocked<SchulconnexCourseSyncService>;
	let schulconnexLicenseProvisioningService: DeepMocked<SchulconnexLicenseProvisioningService>;
	let groupService: DeepMocked<GroupService>;
	let configService: DeepMocked<ConfigService<ProvisioningConfig, true>>;
	let schulconnexToolProvisioningService: DeepMocked<SchulconnexToolProvisioningService>;

	const config: Partial<ProvisioningConfig> = {};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexSyncProvisioningStrategy,
				{
					provide: SchulconnexSchoolProvisioningService,
					useValue: createMock<SchulconnexSchoolProvisioningService>(),
				},
				{
					provide: SchulconnexUserProvisioningService,
					useValue: createMock<SchulconnexUserProvisioningService>(),
				},
				{
					provide: SchulconnexGroupProvisioningService,
					useValue: createMock<SchulconnexGroupProvisioningService>(),
				},
				{
					provide: SchulconnexCourseSyncService,
					useValue: createMock<SchulconnexCourseSyncService>(),
				},
				{
					provide: SchulconnexLicenseProvisioningService,
					useValue: createMock<SchulconnexLicenseProvisioningService>(),
				},
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
				{
					provide: SchulconnexToolProvisioningService,
					useValue: createMock<SchulconnexToolProvisioningService>(),
				},
				{
					provide: SchulconnexResponseMapper,
					useValue: createMock<SchulconnexResponseMapper>(),
				},
				{
					provide: SchulconnexRestClient,
					useValue: createMock<SchulconnexRestClient>(),
				},
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn().mockImplementation((key: keyof ProvisioningConfig) => config[key]),
					},
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		strategy = module.get(SchulconnexSyncProvisioningStrategy);
		schulconnexSchoolProvisioningService = module.get(SchulconnexSchoolProvisioningService);
		schulconnexUserProvisioningService = module.get(SchulconnexUserProvisioningService);
		schulconnexGroupProvisioningService = module.get(SchulconnexGroupProvisioningService);
		schulconnexCourseSyncService = module.get(SchulconnexCourseSyncService);
		schulconnexLicenseProvisioningService = module.get(SchulconnexLicenseProvisioningService);
		groupService = module.get(GroupService);
		configService = module.get(ConfigService);
		schulconnexToolProvisioningService = module.get(SchulconnexToolProvisioningService);
	});

	beforeEach(() => {
		config.FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED = false;
		config.FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED = false;
		config.FEATURE_OTHER_GROUPUSERS_PROVISIONING_ENABLED = true;
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getType', () => {
		describe('when it is called', () => {
			it('should return type SANIS', () => {
				const result = strategy.getType();

				expect(result).toEqual(SystemProvisioningStrategy.SCHULCONNEX_LEGACY);
			});
		});
	});

	describe('apply is called', () => {
		describe('when school data is provided', () => {
			const setup = () => {
				const externalUserId = 'externalUserId';
				const externalSchoolId = 'externalSchoolId';
				const schoolId = 'schoolId';
				const oauthData = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: externalSchoolId,
						name: 'schoolName',
					}),
					externalUser: externalUserDtoFactory.build(),
				});
				const user = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					firstName: 'firstName',
					lastName: 'lastName',
					email: 'email',
					schoolId: 'schoolId',
					externalId: externalUserId,
				});
				const school = legacySchoolDoFactory.build({
					id: schoolId,
					name: 'schoolName',
					externalId: externalSchoolId,
				});

				schulconnexSchoolProvisioningService.provisionExternalSchool.mockResolvedValue(school);
				schulconnexUserProvisioningService.provisionExternalUser.mockResolvedValue(user);

				return {
					oauthData,
					schoolId,
				};
			};

			it('should provision school', async () => {
				const { oauthData } = setup();

				await strategy.apply(oauthData);

				expect(schulconnexSchoolProvisioningService.provisionExternalSchool).toHaveBeenCalledWith(
					oauthData.externalSchool,
					oauthData.system.systemId
				);
			});
		});

		describe('when user data is provided', () => {
			const setup = () => {
				const externalUserId = 'externalUserId';
				const externalSchoolId = 'externalSchoolId';
				const schoolId = 'schoolId';
				const oauthData = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: externalSchoolId,
						name: 'schoolName',
					}),
					externalUser: externalUserDtoFactory.build({ externalId: externalUserId }),
				});
				const user = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					firstName: 'firstName',
					lastName: 'lastName',
					email: 'email',
					schoolId: 'schoolId',
					externalId: externalUserId,
				});
				const school = legacySchoolDoFactory.build({
					id: schoolId,
					name: 'schoolName',
					externalId: externalSchoolId,
				});

				schulconnexSchoolProvisioningService.provisionExternalSchool.mockResolvedValue(school);
				schulconnexUserProvisioningService.provisionExternalUser.mockResolvedValue(user);

				return {
					oauthData,
					schoolId,
				};
			};

			it('should provision external user', async () => {
				const { oauthData, schoolId } = setup();

				await strategy.apply(oauthData);

				expect(schulconnexUserProvisioningService.provisionExternalUser).toHaveBeenCalledWith(
					oauthData.externalUser,
					oauthData.system.systemId,
					schoolId
				);
			});

			it('should return the users external id', async () => {
				const { oauthData } = setup();

				const result = await strategy.apply(oauthData);

				expect(result).toEqual(new ProvisioningDto({ externalUserId: oauthData.externalUser.externalId }));
			});
		});

		describe('when group data is provided and the feature is enabled', () => {
			const setup = () => {
				config.FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED = true;

				const externalUserId = 'externalUserId';
				const externalGroups = externalGroupDtoFactory.buildList(2);
				const oauthData = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: new ObjectId().toHexString(),
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalSchool: externalSchoolDtoFactory.build(),
					externalUser: externalUserDtoFactory.build({ externalId: externalUserId }),
					externalGroups,
				});

				const user = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					externalId: externalUserId,
				});

				schulconnexUserProvisioningService.provisionExternalUser.mockResolvedValueOnce(user);
				schulconnexGroupProvisioningService.filterExternalGroups.mockResolvedValueOnce(externalGroups);

				return {
					oauthData,
				};
			};

			it('should remove external groups and affiliation', async () => {
				const { oauthData } = setup();

				await strategy.apply(oauthData);

				expect(schulconnexGroupProvisioningService.removeExternalGroupsAndAffiliation).toHaveBeenCalledWith(
					oauthData.externalUser.externalId,
					oauthData.externalGroups,
					oauthData.system.systemId
				);
			});

			it('should provision every external group', async () => {
				const { oauthData } = setup();

				await strategy.apply(oauthData);

				expect(schulconnexGroupProvisioningService.provisionExternalGroup).toHaveBeenCalledWith(
					oauthData.externalGroups?.[0],
					oauthData.externalSchool,
					oauthData.system.systemId
				);
				expect(schulconnexGroupProvisioningService.provisionExternalGroup).toHaveBeenCalledWith(
					oauthData.externalGroups?.[1],
					oauthData.externalSchool,
					oauthData.system.systemId
				);
			});
		});

		describe('when group data is provided, but the feature is disabled', () => {
			const setup = () => {
				config.FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED = false;

				const externalUserId = 'externalUserId';
				const oauthData = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalUser: externalUserDtoFactory.build({ externalId: externalUserId }),
					externalGroups: externalGroupDtoFactory.buildList(2),
				});

				const user = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					externalId: externalUserId,
				});

				schulconnexUserProvisioningService.provisionExternalUser.mockResolvedValue(user);

				return {
					oauthData,
				};
			};

			it('should not remove external groups and affiliation', async () => {
				const { oauthData } = setup();

				await strategy.apply(oauthData);

				expect(schulconnexGroupProvisioningService.removeExternalGroupsAndAffiliation).not.toHaveBeenCalled();
			});

			it('should not provision groups', async () => {
				const { oauthData } = setup();

				await strategy.apply(oauthData);

				expect(schulconnexGroupProvisioningService.provisionExternalGroup).not.toHaveBeenCalled();
			});
		});

		describe('when group data is not provided', () => {
			const setup = () => {
				config.FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED = true;

				const externalUserId = 'externalUserId';
				const oauthData = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalUser: externalUserDtoFactory.build({ externalId: externalUserId }),
					externalGroups: undefined,
				});

				const user = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					externalId: externalUserId,
				});

				schulconnexUserProvisioningService.provisionExternalUser.mockResolvedValue(user);

				return {
					externalUserId,
					oauthData,
				};
			};

			it('should remove external groups and affiliation', async () => {
				const { externalUserId, oauthData } = setup();

				await strategy.apply(oauthData);

				expect(schulconnexGroupProvisioningService.removeExternalGroupsAndAffiliation).toHaveBeenCalledWith(
					externalUserId,
					[],
					oauthData.system.systemId
				);
			});
		});

		describe('when an existing group gets provisioned', () => {
			const setup = () => {
				config.FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED = true;
				config.FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED = true;

				const externalUserId = 'externalUserId';
				const externalGroups = externalGroupDtoFactory.buildList(2);
				const oauthData = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: new ObjectId().toHexString(),
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalSchool: externalSchoolDtoFactory.build(),
					externalUser: externalUserDtoFactory.build({ externalId: externalUserId }),
					externalGroups,
				});

				const user = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					externalId: externalUserId,
				});
				const existingGroup = groupFactory.build();
				const updatedGroup = groupFactory.build();

				schulconnexUserProvisioningService.provisionExternalUser.mockResolvedValueOnce(user);
				schulconnexGroupProvisioningService.removeExternalGroupsAndAffiliation.mockResolvedValueOnce([]);
				schulconnexGroupProvisioningService.filterExternalGroups.mockResolvedValueOnce(externalGroups);
				groupService.findByExternalSource.mockResolvedValueOnce(existingGroup);
				schulconnexGroupProvisioningService.provisionExternalGroup.mockResolvedValueOnce(updatedGroup);

				return {
					oauthData,
					existingGroup,
					updatedGroup,
				};
			};

			it('should synchronize all linked courses with the group', async () => {
				const { oauthData, updatedGroup, existingGroup } = setup();

				await strategy.apply(oauthData);

				expect(schulconnexCourseSyncService.synchronizeCourseWithGroup).toHaveBeenCalledWith(
					updatedGroup,
					existingGroup
				);
			});
		});

		describe('when a new group is provisioned', () => {
			const setup = () => {
				config.FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED = true;
				config.FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED = true;

				const externalUserId = 'externalUserId';
				const externalGroups = externalGroupDtoFactory.buildList(2);
				const oauthData = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: new ObjectId().toHexString(),
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalSchool: externalSchoolDtoFactory.build(),
					externalUser: externalUserDtoFactory.build({ externalId: externalUserId }),
					externalGroups,
				});

				const user = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					externalId: externalUserId,
				});
				const updatedGroup = groupFactory.build();

				schulconnexUserProvisioningService.provisionExternalUser.mockResolvedValueOnce(user);
				schulconnexGroupProvisioningService.removeExternalGroupsAndAffiliation.mockResolvedValueOnce([]);
				schulconnexGroupProvisioningService.filterExternalGroups.mockResolvedValueOnce(externalGroups);
				groupService.findByExternalSource.mockResolvedValueOnce(null);
				schulconnexGroupProvisioningService.provisionExternalGroup.mockResolvedValueOnce(updatedGroup);

				return {
					oauthData,
					updatedGroup,
				};
			};

			it('should synchronize all linked courses with the group', async () => {
				const { oauthData, updatedGroup } = setup();

				await strategy.apply(oauthData);

				expect(schulconnexCourseSyncService.synchronizeCourseWithGroup).toHaveBeenCalledWith(updatedGroup, undefined);
			});
		});

		describe('when a user was removed from a group', () => {
			const setup = () => {
				config.FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED = true;
				config.FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED = true;

				const externalUserId = 'externalUserId';
				const oauthData = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: new ObjectId().toHexString(),
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalSchool: externalSchoolDtoFactory.build(),
					externalUser: externalUserDtoFactory.build({ externalId: externalUserId }),
					externalGroups: [],
				});

				const user = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					externalId: externalUserId,
				});
				const group = groupFactory.build();

				schulconnexUserProvisioningService.provisionExternalUser.mockResolvedValueOnce(user);
				schulconnexGroupProvisioningService.removeExternalGroupsAndAffiliation.mockResolvedValueOnce([group]);
				schulconnexGroupProvisioningService.filterExternalGroups.mockResolvedValueOnce([]);
				groupService.findByExternalSource.mockResolvedValueOnce(null);
				schulconnexGroupProvisioningService.provisionExternalGroup.mockResolvedValueOnce(null);

				return {
					oauthData,
					group,
				};
			};

			it('should synchronize a course with a group', async () => {
				const { oauthData, group } = setup();

				await strategy.apply(oauthData);

				expect(schulconnexCourseSyncService.synchronizeCourseWithGroup).toHaveBeenCalledWith(group, group);
			});
		});

		describe('when provision user licenses', () => {
			describe('when the feature is enabled', () => {
				const setup = () => {
					const oauthData: OauthDataDto = new OauthDataDto({
						system: new ProvisioningSystemDto({
							systemId: new ObjectId().toHexString(),
							provisioningStrategy: SystemProvisioningStrategy.OIDC,
						}),
						externalUser: externalUserDtoFactory.build(),
						externalLicenses: [],
					});
					const user = userDoFactory.build({
						id: new ObjectId().toHexString(),
					});

					schulconnexUserProvisioningService.provisionExternalUser.mockResolvedValue(user);
					configService.get.mockReturnValue(true);

					return {
						oauthData,
						user,
					};
				};

				it('should provision user licenses', async () => {
					const { oauthData, user } = setup();

					await strategy.apply(oauthData);

					expect(schulconnexLicenseProvisioningService.provisionExternalLicenses).toHaveBeenCalledWith(
						user.id,
						oauthData.externalLicenses
					);
				});

				it('should provision school external tool', async () => {
					const { oauthData, user } = setup();

					await strategy.apply(oauthData);

					expect(schulconnexToolProvisioningService.provisionSchoolExternalTools).toHaveBeenCalledWith(
						user.id,
						user.schoolId,
						oauthData.system.systemId
					);
				});
			});

			describe('when the feature is disabled', () => {
				const setup = () => {
					const oauthData = new OauthDataDto({
						system: new ProvisioningSystemDto({
							systemId: new ObjectId().toHexString(),
							provisioningStrategy: SystemProvisioningStrategy.OIDC,
						}),
						externalUser: externalUserDtoFactory.build(),
						externalLicenses: [],
					});
					const user = userDoFactory.build({
						id: new ObjectId().toHexString(),
					});

					schulconnexUserProvisioningService.provisionExternalUser.mockResolvedValue(user);
					configService.get.mockReturnValue(false);

					return {
						oauthData,
					};
				};

				it('should not provision user licenses', async () => {
					const { oauthData } = setup();

					await strategy.apply(oauthData);

					expect(schulconnexLicenseProvisioningService.provisionExternalLicenses).not.toHaveBeenCalled();
				});

				it('should not provision school external tool', async () => {
					const { oauthData } = setup();

					await strategy.apply(oauthData);

					expect(schulconnexToolProvisioningService.provisionSchoolExternalTools).not.toHaveBeenCalled();
				});
			});
		});
	});
});
