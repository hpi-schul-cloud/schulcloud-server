import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchulconnexRestClient } from '@infra/schulconnex-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { GroupService } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { legacySchoolDoFactory } from '@modules/legacy-school/testing';
import { UserDO } from '@modules/user/domain';
import { userDoFactory } from '@modules/user/testing';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SchulconnexGroupProvisioningProducer, SchulconnexLicenseProvisioningProducer } from '../../amqp';
import {
	SchulconnexGroupProvisioningMessage,
	SchulconnexGroupRemovalMessage,
	SchulconnexLicenseProvisioningMessage,
} from '../../domain';
import { ExternalLicenseDto, OauthDataDto, ProvisioningDto, ProvisioningSystemDto } from '../../dto';
import { ProvisioningConfig } from '../../provisioning.config';
import { externalGroupDtoFactory, externalSchoolDtoFactory, externalUserDtoFactory } from '../../testing';
import { SchulconnexAsyncProvisioningStrategy } from './schulconnex-async-provisioning.strategy';
import { SchulconnexResponseMapper } from './schulconnex-response-mapper';
import {
	SchulconnexGroupProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexUserProvisioningService,
} from './service';

describe(SchulconnexAsyncProvisioningStrategy.name, () => {
	let module: TestingModule;
	let strategy: SchulconnexAsyncProvisioningStrategy;

	let schulconnexSchoolProvisioningService: DeepMocked<SchulconnexSchoolProvisioningService>;
	let schulconnexUserProvisioningService: DeepMocked<SchulconnexUserProvisioningService>;
	let schulconnexGroupProvisioningService: DeepMocked<SchulconnexGroupProvisioningService>;
	let schulconnexGroupProvisioningProducer: DeepMocked<SchulconnexGroupProvisioningProducer>;
	let schulconnexLicenseProvisioningProducer: DeepMocked<SchulconnexLicenseProvisioningProducer>;
	let groupService: DeepMocked<GroupService>;
	let configService: DeepMocked<ConfigService<ProvisioningConfig, true>>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexAsyncProvisioningStrategy,
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
					provide: SchulconnexGroupProvisioningProducer,
					useValue: createMock<SchulconnexGroupProvisioningProducer>(),
				},
				{
					provide: SchulconnexLicenseProvisioningProducer,
					useValue: createMock<SchulconnexLicenseProvisioningProducer>(),
				},
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
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
					useValue: createMock<ConfigService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		strategy = module.get(SchulconnexAsyncProvisioningStrategy);
		schulconnexSchoolProvisioningService = module.get(SchulconnexSchoolProvisioningService);
		schulconnexUserProvisioningService = module.get(SchulconnexUserProvisioningService);
		schulconnexGroupProvisioningService = module.get(SchulconnexGroupProvisioningService);
		schulconnexGroupProvisioningProducer = module.get(SchulconnexGroupProvisioningProducer);
		schulconnexLicenseProvisioningProducer = module.get(SchulconnexLicenseProvisioningProducer);
		groupService = module.get(GroupService);
		configService = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getType', () => {
		describe('when it is called', () => {
			it('should return SCHULCONNEX_ASYNC', () => {
				const result: SystemProvisioningStrategy = strategy.getType();

				expect(result).toEqual(SystemProvisioningStrategy.SCHULCONNEX_ASYNC);
			});
		});
	});

	describe('apply', () => {
		describe('when provisioning user and school data', () => {
			const setup = () => {
				const externalUser = externalUserDtoFactory.build();
				const externalSchool = externalSchoolDtoFactory.build();
				const schoolId = new ObjectId().toHexString();
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: new ObjectId().toHexString(),
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
					}),
					externalSchool,
					externalUser,
				});
				const user: UserDO = userDoFactory.build({
					schoolId,
					externalId: externalUser.externalId,
				});
				const school = legacySchoolDoFactory.build({
					id: schoolId,
					name: 'schoolName',
					externalId: externalSchool.externalId,
				});

				schulconnexSchoolProvisioningService.provisionExternalSchool.mockResolvedValueOnce(school);
				schulconnexUserProvisioningService.provisionExternalUser.mockResolvedValueOnce(user);
				configService.get.mockReturnValueOnce(false);
				configService.get.mockReturnValueOnce(false);

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

			it('should provision user', async () => {
				const { oauthData, schoolId } = setup();

				await strategy.apply(oauthData);

				expect(schulconnexUserProvisioningService.provisionExternalUser).toHaveBeenCalledWith(
					oauthData.externalUser,
					oauthData.system.systemId,
					schoolId
				);
			});

			it('should return the provisioning', async () => {
				const { oauthData } = setup();

				const result = await strategy.apply(oauthData);

				expect(result).toEqual(new ProvisioningDto({ externalUserId: oauthData.externalUser.externalId }));
			});
		});

		describe('when provisioning groups', () => {
			const setup = () => {
				const externalUser = externalUserDtoFactory.build();
				const externalSchool = externalSchoolDtoFactory.build();
				const externalGroup = externalGroupDtoFactory.build();
				const schoolId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const groupToKeep = groupFactory.build({
					externalSource: { externalId: externalGroup.externalId, systemId },
				});
				const groupToRemove = groupFactory.build({
					externalSource: { externalId: 'other-group', systemId },
				});
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
					}),
					externalSchool,
					externalUser,
					externalGroups: [externalGroup],
				});
				const userId = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId(
					{
						schoolId,
						externalId: externalUser.externalId,
					},
					userId
				);
				const school = legacySchoolDoFactory.build({
					id: schoolId,
					name: 'schoolName',
					externalId: externalSchool.externalId,
				});

				schulconnexSchoolProvisioningService.provisionExternalSchool.mockResolvedValueOnce(school);
				schulconnexUserProvisioningService.provisionExternalUser.mockResolvedValueOnce(user);
				configService.get.mockReturnValueOnce(true);
				schulconnexGroupProvisioningService.filterExternalGroups.mockResolvedValueOnce([externalGroup]);
				groupService.findGroups.mockResolvedValueOnce({ data: [groupToKeep, groupToRemove], total: 2 });
				configService.get.mockReturnValueOnce(false);

				return {
					oauthData,
					userId,
					groupToRemove,
					externalGroup,
				};
			};

			it('should remove the user from groups he is not in anymore', async () => {
				const { oauthData, userId, groupToRemove } = setup();

				await strategy.apply(oauthData);

				expect(schulconnexGroupProvisioningProducer.removeUserFromGroup).toHaveBeenCalledTimes(1);
				expect(schulconnexGroupProvisioningProducer.removeUserFromGroup).toHaveBeenCalledWith<
					[SchulconnexGroupRemovalMessage]
				>({
					userId,
					groupId: groupToRemove.id,
				});
			});

			it('should provision groups', async () => {
				const { oauthData, externalGroup } = setup();

				await strategy.apply(oauthData);

				expect(schulconnexGroupProvisioningProducer.removeUserFromGroup).toHaveBeenCalledTimes(1);
				expect(schulconnexGroupProvisioningProducer.provisonGroup).toHaveBeenCalledWith<
					[SchulconnexGroupProvisioningMessage]
				>({
					systemId: oauthData.system.systemId,
					externalSchool: oauthData.externalSchool,
					externalGroup,
				});
			});
		});

		describe('when provisioning licenses', () => {
			const setup = () => {
				const externalUser = externalUserDtoFactory.build();
				const externalSchool = externalSchoolDtoFactory.build();
				const externalLicense = new ExternalLicenseDto({
					mediumId: 'medium:1',
				});
				const schoolId = new ObjectId().toHexString();
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: new ObjectId().toHexString(),
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
					}),
					externalSchool,
					externalUser,
					externalLicenses: [externalLicense],
				});
				const userId = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId(
					{
						schoolId,
						externalId: externalUser.externalId,
					},
					userId
				);
				const school = legacySchoolDoFactory.build({
					id: schoolId,
					name: 'schoolName',
					externalId: externalSchool.externalId,
				});

				schulconnexSchoolProvisioningService.provisionExternalSchool.mockResolvedValueOnce(school);
				schulconnexUserProvisioningService.provisionExternalUser.mockResolvedValueOnce(user);
				configService.get.mockReturnValueOnce(false);
				configService.get.mockReturnValueOnce(true);

				return {
					oauthData,
					user,
					schoolId,
					userId,
					externalLicense,
				};
			};

			it('should provision licenses', async () => {
				const { oauthData, userId, schoolId, externalLicense } = setup();

				await strategy.apply(oauthData);

				expect(schulconnexLicenseProvisioningProducer.provisonLicenses).toHaveBeenCalledWith<
					[SchulconnexLicenseProvisioningMessage]
				>({
					userId,
					schoolId,
					systemId: oauthData.system.systemId,
					externalLicenses: [externalLicense],
				});
			});
		});

		describe('when provisioning licenses, but the user has no licenses', () => {
			const setup = () => {
				const externalUser = externalUserDtoFactory.build();
				const externalSchool = externalSchoolDtoFactory.build();
				const schoolId = new ObjectId().toHexString();
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: new ObjectId().toHexString(),
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
					}),
					externalSchool,
					externalUser,
					externalLicenses: undefined,
				});
				const userId = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId(
					{
						schoolId,
						externalId: externalUser.externalId,
					},
					userId
				);
				const school = legacySchoolDoFactory.build({
					id: schoolId,
					name: 'schoolName',
					externalId: externalSchool.externalId,
				});

				schulconnexSchoolProvisioningService.provisionExternalSchool.mockResolvedValueOnce(school);
				schulconnexUserProvisioningService.provisionExternalUser.mockResolvedValueOnce(user);
				configService.get.mockReturnValueOnce(false);
				configService.get.mockReturnValueOnce(true);

				return {
					oauthData,
					user,
					schoolId,
					userId,
				};
			};

			it('should remove all licenses', async () => {
				const { oauthData, userId, schoolId } = setup();

				await strategy.apply(oauthData);

				expect(schulconnexLicenseProvisioningProducer.provisonLicenses).toHaveBeenCalledWith<
					[SchulconnexLicenseProvisioningMessage]
				>({
					userId,
					schoolId,
					systemId: oauthData.system.systemId,
					externalLicenses: [],
				});
			});
		});

		describe('when the user has no id', () => {
			const setup = () => {
				const externalUser = externalUserDtoFactory.build();
				const externalSchool = externalSchoolDtoFactory.build();
				const schoolId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
					}),
					externalSchool,
					externalUser,
				});
				const user: UserDO = userDoFactory.build({
					id: undefined,
					schoolId,
					externalId: externalUser.externalId,
				});
				const school = legacySchoolDoFactory.build({
					id: schoolId,
					name: 'schoolName',
					externalId: externalSchool.externalId,
				});

				schulconnexSchoolProvisioningService.provisionExternalSchool.mockResolvedValueOnce(school);
				schulconnexUserProvisioningService.provisionExternalUser.mockResolvedValueOnce(user);
				configService.get.mockReturnValueOnce(true);

				return {
					oauthData,
				};
			};

			it('should remove the user from groups he is not in anymore', async () => {
				const { oauthData } = setup();

				await expect(strategy.apply(oauthData)).rejects.toThrow(NotFoundLoggableException);
			});
		});
	});
});
