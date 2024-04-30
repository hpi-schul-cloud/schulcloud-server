import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Group, GroupService } from '@modules/group';
import { NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacySchoolDo, UserDO } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import {
	externalGroupDtoFactory,
	externalSchoolDtoFactory,
	groupFactory,
	legacySchoolDoFactory,
	userDoFactory,
} from '@shared/testing';
import { IProvisioningFeatures, ProvisioningFeatures } from '../../config';
import {
	ExternalGroupDto,
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningDto,
	ProvisioningSystemDto,
} from '../../dto';
import { ProvisioningConfig } from '../../provisioning.config';
import { SchulconnexProvisioningStrategy } from './schulconnex.strategy';
import {
	SchulconnexCourseSyncService,
	SchulconnexGroupProvisioningService,
	SchulconnexLicenseProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexUserProvisioningService,
} from './service';

class TestSchulconnexStrategy extends SchulconnexProvisioningStrategy {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		throw new NotImplementedException();
	}

	getType(): SystemProvisioningStrategy {
		throw new NotImplementedException();
	}
}

describe(SchulconnexProvisioningStrategy.name, () => {
	let module: TestingModule;
	let strategy: TestSchulconnexStrategy;

	let provisioningFeatures: IProvisioningFeatures;
	let schulconnexSchoolProvisioningService: DeepMocked<SchulconnexSchoolProvisioningService>;
	let schulconnexUserProvisioningService: DeepMocked<SchulconnexUserProvisioningService>;
	let schulconnexGroupProvisioningService: DeepMocked<SchulconnexGroupProvisioningService>;
	let schulconnexCourseSyncService: DeepMocked<SchulconnexCourseSyncService>;
	let schulconnexLicenseProvisioningService: DeepMocked<SchulconnexLicenseProvisioningService>;
	let groupService: DeepMocked<GroupService>;
	let configService: DeepMocked<ConfigService<ProvisioningConfig, true>>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TestSchulconnexStrategy,
				{
					provide: ProvisioningFeatures,
					useValue: {},
				},
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
					provide: ConfigService<ProvisioningConfig, true>,
					useValue: createMock<ConfigService<ProvisioningConfig, true>>(),
				},
			],
		}).compile();

		strategy = module.get(TestSchulconnexStrategy);
		provisioningFeatures = module.get(ProvisioningFeatures);
		schulconnexSchoolProvisioningService = module.get(SchulconnexSchoolProvisioningService);
		schulconnexUserProvisioningService = module.get(SchulconnexUserProvisioningService);
		schulconnexGroupProvisioningService = module.get(SchulconnexGroupProvisioningService);
		schulconnexCourseSyncService = module.get(SchulconnexCourseSyncService);
		schulconnexLicenseProvisioningService = module.get(SchulconnexLicenseProvisioningService);
		groupService = module.get(GroupService);
		configService = module.get(ConfigService);
	});

	beforeEach(() => {
		Object.assign<IProvisioningFeatures, Partial<IProvisioningFeatures>>(provisioningFeatures, {
			schulconnexGroupProvisioningEnabled: false,
			schulconnexCourseSyncEnabled: false,
		});
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('apply is called', () => {
		describe('when school data is provided', () => {
			const setup = () => {
				const externalUserId = 'externalUserId';
				const externalSchoolId = 'externalSchoolId';
				const schoolId = 'schoolId';
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: externalSchoolId,
						name: 'schoolName',
					}),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
				});
				const user: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					firstName: 'firstName',
					lastName: 'lastName',
					email: 'email',
					schoolId: 'schoolId',
					externalId: externalUserId,
				});
				const school: LegacySchoolDo = legacySchoolDoFactory.build({
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
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: externalSchoolId,
						name: 'schoolName',
					}),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
				});
				const user: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					firstName: 'firstName',
					lastName: 'lastName',
					email: 'email',
					schoolId: 'schoolId',
					externalId: externalUserId,
				});
				const school: LegacySchoolDo = legacySchoolDoFactory.build({
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

				const result: ProvisioningDto = await strategy.apply(oauthData);

				expect(result).toEqual(new ProvisioningDto({ externalUserId: oauthData.externalUser.externalId }));
			});
		});

		describe('when group data is provided and the feature is enabled', () => {
			const setup = () => {
				provisioningFeatures.schulconnexGroupProvisioningEnabled = true;

				const externalUserId = 'externalUserId';
				const externalGroups: ExternalGroupDto[] = externalGroupDtoFactory.buildList(2);
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: new ObjectId().toHexString(),
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalSchool: externalSchoolDtoFactory.build(),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
					externalGroups,
				});

				const user: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
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
				provisioningFeatures.schulconnexGroupProvisioningEnabled = false;

				const externalUserId = 'externalUserId';
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
					externalGroups: externalGroupDtoFactory.buildList(2),
				});

				const user: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
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
				provisioningFeatures.schulconnexGroupProvisioningEnabled = true;

				const externalUserId = 'externalUserId';
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
					externalGroups: undefined,
				});

				const user: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
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
				provisioningFeatures.schulconnexGroupProvisioningEnabled = true;
				provisioningFeatures.schulconnexCourseSyncEnabled = true;

				const externalUserId = 'externalUserId';
				const externalGroups: ExternalGroupDto[] = externalGroupDtoFactory.buildList(2);
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: new ObjectId().toHexString(),
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalSchool: externalSchoolDtoFactory.build(),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
					externalGroups,
				});

				const user: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					externalId: externalUserId,
				});
				const existingGroup: Group = groupFactory.build();
				const updatedGroup: Group = groupFactory.build();

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
				provisioningFeatures.schulconnexGroupProvisioningEnabled = true;
				provisioningFeatures.schulconnexCourseSyncEnabled = true;

				const externalUserId = 'externalUserId';
				const externalGroups: ExternalGroupDto[] = externalGroupDtoFactory.buildList(2);
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: new ObjectId().toHexString(),
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalSchool: externalSchoolDtoFactory.build(),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
					externalGroups,
				});

				const user: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					externalId: externalUserId,
				});
				const updatedGroup: Group = groupFactory.build();

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
				provisioningFeatures.schulconnexGroupProvisioningEnabled = true;
				provisioningFeatures.schulconnexCourseSyncEnabled = true;

				const externalUserId = 'externalUserId';
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: new ObjectId().toHexString(),
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalSchool: externalSchoolDtoFactory.build(),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
					externalGroups: [],
				});

				const user: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					externalId: externalUserId,
				});
				const group: Group = groupFactory.build();

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
						externalUser: new ExternalUserDto({
							externalId: 'externalUserId',
						}),
						externalLicenses: [],
					});
					const user: UserDO = userDoFactory.build({
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
			});

			describe('when the feature is disabled', () => {
				const setup = () => {
					const oauthData: OauthDataDto = new OauthDataDto({
						system: new ProvisioningSystemDto({
							systemId: new ObjectId().toHexString(),
							provisioningStrategy: SystemProvisioningStrategy.OIDC,
						}),
						externalUser: new ExternalUserDto({
							externalId: 'externalUserId',
						}),
						externalLicenses: [],
					});
					const user: UserDO = userDoFactory.build({
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
			});
		});
	});
});
