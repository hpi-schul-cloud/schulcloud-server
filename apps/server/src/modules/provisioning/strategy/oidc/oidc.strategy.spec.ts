import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacySchoolDo, RoleName, UserDO } from '@shared/domain';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { legacySchoolDoFactory, userDoFactory } from '@shared/testing';
import { externalGroupDtoFactory } from '@shared/testing/factory/external-group-dto.factory';
import { externalSchoolDtoFactory } from '@shared/testing/factory/external-school-dto.factory';
import {
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningDto,
	ProvisioningSystemDto,
} from '../../dto';
import { OidcProvisioningStrategy } from './oidc.strategy';
import { OidcProvisioningService } from './service/oidc-provisioning.service';

class TestOidcStrategy extends OidcProvisioningStrategy {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		throw new NotImplementedException();
	}

	getType(): SystemProvisioningStrategy {
		throw new NotImplementedException();
	}
}

describe('OidcStrategy', () => {
	let module: TestingModule;
	let strategy: TestOidcStrategy;

	let oidcProvisioningService: DeepMocked<OidcProvisioningService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TestOidcStrategy,
				{
					provide: OidcProvisioningService,
					useValue: createMock<OidcProvisioningService>(),
				},
			],
		}).compile();

		strategy = module.get(TestOidcStrategy);
		oidcProvisioningService = module.get(OidcProvisioningService);
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

				oidcProvisioningService.provisionExternalSchool.mockResolvedValue(school);
				oidcProvisioningService.provisionExternalUser.mockResolvedValue(user);

				return {
					oauthData,
					schoolId,
				};
			};

			it('should provision school', async () => {
				const { oauthData } = setup();

				await strategy.apply(oauthData);

				expect(oidcProvisioningService.provisionExternalSchool).toHaveBeenCalledWith(
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

				oidcProvisioningService.provisionExternalSchool.mockResolvedValue(school);
				oidcProvisioningService.provisionExternalUser.mockResolvedValue(user);

				return {
					oauthData,
					schoolId,
				};
			};

			it('should provision external user', async () => {
				const { oauthData, schoolId } = setup();

				await strategy.apply(oauthData);

				expect(oidcProvisioningService.provisionExternalUser).toHaveBeenCalledWith(
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
				Configuration.set('FEATURE_SANIS_GROUP_PROVISIONING_ENABLED', true);

				const externalUserId = 'externalUserId';
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalSchool: externalSchoolDtoFactory.build(),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
					externalGroups: externalGroupDtoFactory.buildList(2),
				});

				const user: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					externalId: externalUserId,
				});

				oidcProvisioningService.provisionExternalUser.mockResolvedValue(user);

				return {
					oauthData,
				};
			};

			it('should remove external groups and affiliation', async () => {
				const { oauthData } = setup();

				await strategy.apply(oauthData);

				expect(oidcProvisioningService.removeExternalGroupsAndAffiliation).toHaveBeenCalledWith(
					oauthData.externalUser.externalId,
					oauthData.externalGroups,
					oauthData.system.systemId
				);
			});

			it('should provision every external group', async () => {
				const { oauthData } = setup();

				await strategy.apply(oauthData);

				expect(oidcProvisioningService.provisionExternalGroup).toHaveBeenCalledWith(
					oauthData.externalGroups?.[0],
					oauthData.externalSchool,
					oauthData.system.systemId
				);
				expect(oidcProvisioningService.provisionExternalGroup).toHaveBeenCalledWith(
					oauthData.externalGroups?.[1],
					oauthData.externalSchool,
					oauthData.system.systemId
				);
			});
		});

		describe('when group data is provided, but the feature is disabled', () => {
			const setup = () => {
				Configuration.set('FEATURE_SANIS_GROUP_PROVISIONING_ENABLED', false);

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

				oidcProvisioningService.provisionExternalUser.mockResolvedValue(user);

				return {
					oauthData,
				};
			};

			it('should not remove external groups and affiliation', async () => {
				const { oauthData } = setup();

				await strategy.apply(oauthData);

				expect(oidcProvisioningService.removeExternalGroupsAndAffiliation).not.toHaveBeenCalled();
			});

			it('should not provision groups', async () => {
				const { oauthData } = setup();

				await strategy.apply(oauthData);

				expect(oidcProvisioningService.provisionExternalGroup).not.toHaveBeenCalled();
			});
		});

		describe('when group data is not provided', () => {
			const setup = () => {
				Configuration.set('FEATURE_SANIS_GROUP_PROVISIONING_ENABLED', true);

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

				oidcProvisioningService.provisionExternalUser.mockResolvedValue(user);

				return {
					externalUserId,
					oauthData,
				};
			};

			it('should remove external groups and affiliation', async () => {
				const { externalUserId, oauthData } = setup();

				await strategy.apply(oauthData);

				expect(oidcProvisioningService.removeExternalGroupsAndAffiliation).toHaveBeenCalledWith(
					externalUserId,
					[],
					oauthData.system.systemId
				);
			});
		});
	});
});
