import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	SchulconnexGruppenResponse,
	SchulconnexPoliciesInfoLicenseResponse,
	SchulconnexPoliciesInfoResponse,
	SchulconnexResponse,
	SchulconnexResponseValidationGroups,
	SchulconnexRestClient,
} from '@infra/schulconnex-client';
import {
	schulconnexPoliciesInfoErrorResponseFactory,
	schulconnexPoliciesInfoLicenseResponseFactory,
	schulconnexPoliciesInfoResponseFactory,
	schulconnexResponseFactory,
} from '@infra/schulconnex-client/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { GroupService, GroupTypes } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { legacySchoolDoFactory } from '@modules/legacy-school/testing';
import { userDoFactory } from '@modules/user/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException, ValidationErrorLoggableException } from '@shared/common/loggable-exception';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import * as classValidator from 'class-validator';
import { randomUUID } from 'crypto';
import { RoleName } from '../../../role';
import { SchulconnexGroupProvisioningProducer, SchulconnexLicenseProvisioningProducer } from '../../amqp';
import {
	SchulconnexGroupProvisioningMessage,
	SchulconnexGroupRemovalMessage,
	SchulconnexLicenseProvisioningMessage,
} from '../../domain';
import {
	ExternalGroupDto,
	ExternalLicenseDto,
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningDto,
	ProvisioningSystemDto,
} from '../../dto';
import { PoliciesInfoErrorResponseLoggable } from '../../loggable';
import { PROVISIONING_CONFIG_TOKEN, ProvisioningConfig } from '../../provisioning.config';
import { externalGroupDtoFactory, externalSchoolDtoFactory, externalUserDtoFactory } from '../../testing';
import { SchulconnexAsyncProvisioningStrategy } from './schulconnex-async-provisioning.strategy';
import { SchulconnexResponseMapper } from './schulconnex-response-mapper';
import {
	SchulconnexGroupProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexUserProvisioningService,
} from './service';
import ArgsType = jest.ArgsType;
import SpyInstance = jest.SpyInstance;

describe(SchulconnexAsyncProvisioningStrategy.name, () => {
	let module: TestingModule;
	let strategy: SchulconnexAsyncProvisioningStrategy;

	let schulconnexSchoolProvisioningService: DeepMocked<SchulconnexSchoolProvisioningService>;
	let schulconnexUserProvisioningService: DeepMocked<SchulconnexUserProvisioningService>;
	let schulconnexGroupProvisioningService: DeepMocked<SchulconnexGroupProvisioningService>;
	let schulconnexGroupProvisioningProducer: DeepMocked<SchulconnexGroupProvisioningProducer>;
	let schulconnexLicenseProvisioningProducer: DeepMocked<SchulconnexLicenseProvisioningProducer>;
	let groupService: DeepMocked<GroupService>;
	let schulconnexResponseMapper: DeepMocked<SchulconnexResponseMapper>;
	let schulconnexRestClient: DeepMocked<SchulconnexRestClient>;
	let config: ProvisioningConfig;
	let logger: DeepMocked<Logger>;

	let validationFunction: SpyInstance<
		ReturnType<typeof classValidator.validate>,
		ArgsType<typeof classValidator.validate>
	>;

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
					provide: PROVISIONING_CONFIG_TOKEN,
					useValue: {
						featureSchulconnexGroupProvisioningEnabled: true,
						featureSchulconnexMediaLicenseEnabled: true,
						provisioningSchulconnexPoliciesInfoUrl: 'policiesInfoUrl',
					},
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
		schulconnexResponseMapper = module.get(SchulconnexResponseMapper);
		schulconnexRestClient = module.get(SchulconnexRestClient);
		config = module.get(PROVISIONING_CONFIG_TOKEN);
		logger = module.get(Logger);

		validationFunction = jest.spyOn(classValidator, 'validate');
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
				const result = strategy.getType();

				expect(result).toEqual(SystemProvisioningStrategy.SCHULCONNEX_ASYNC);
			});
		});
	});

	describe('getData', () => {
		describe('when fetching data from schulconnex', () => {
			const setup = () => {
				const provisioningUrl = 'sanisProvisioningUrl';
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl,
					}),
					idToken: 'sanisIdToken',
					accessToken: randomUUID(),
				});
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
				const user: ExternalUserDto = externalUserDtoFactory.build();
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
				});
				const schulconnexGruppeResponse: SchulconnexGruppenResponse =
					schulconnexResponse.personenkontexte[0].gruppen![0]!;
				const groups: ExternalGroupDto[] = [
					new ExternalGroupDto({
						name: schulconnexGruppeResponse.gruppe.bezeichnung,
						externalId: schulconnexGruppeResponse.gruppe.id,
						type: GroupTypes.CLASS,
						user: {
							externalUserId: schulconnexResponse.personenkontexte[0].id,
							roleName: RoleName.TEACHER,
						},
					}),
				];
				const schulconnexPoliciesInfoLicenseResponse: SchulconnexPoliciesInfoLicenseResponse =
					schulconnexPoliciesInfoLicenseResponseFactory.build();
				const licenses: ExternalLicenseDto[] = SchulconnexResponseMapper.mapToExternalLicenses([
					schulconnexPoliciesInfoLicenseResponse,
				]);
				const schulconnexPoliciesInfoResponse: SchulconnexPoliciesInfoResponse =
					schulconnexPoliciesInfoResponseFactory.build({ data: [schulconnexPoliciesInfoLicenseResponse] });

				config.featureSchulconnexGroupProvisioningEnabled = true;
				config.featureSchulconnexMediaLicenseEnabled = true;
				schulconnexRestClient.getPersonInfo.mockResolvedValueOnce(schulconnexResponse);
				schulconnexResponseMapper.mapToExternalUserDto.mockReturnValue(user);
				schulconnexResponseMapper.mapToExternalSchoolDto.mockReturnValue(school);
				schulconnexResponseMapper.mapToExternalGroupDtos.mockReturnValue(groups);
				validationFunction.mockResolvedValueOnce([]);
				validationFunction.mockResolvedValueOnce([]);
				schulconnexRestClient.getPoliciesInfo.mockResolvedValueOnce(schulconnexPoliciesInfoResponse);
				validationFunction.mockResolvedValueOnce([]);

				return {
					input,
					provisioningUrl,
					user,
					school,
					groups,
					licenses,
					schulconnexResponse,
					schulconnexPoliciesInfoResponse,
				};
			};

			it('should call the rest client of schulconnex with an access token', async () => {
				const { input, provisioningUrl } = setup();

				await strategy.getData(input);

				expect(schulconnexRestClient.getPersonInfo).toHaveBeenCalledWith(input.accessToken, {
					overrideUrl: provisioningUrl,
				});
			});

			it('should validate the response for user and school', async () => {
				const { input, schulconnexResponse } = setup();

				await strategy.getData(input);

				expect(validationFunction).toHaveBeenCalledWith(schulconnexResponse, {
					always: true,
					forbidUnknownValues: false,
					groups: [SchulconnexResponseValidationGroups.USER, SchulconnexResponseValidationGroups.SCHOOL],
				});
			});

			it('should validate the response for groups', async () => {
				const { input, schulconnexResponse } = setup();

				await strategy.getData(input);

				expect(validationFunction).toHaveBeenCalledWith(schulconnexResponse, {
					always: true,
					forbidUnknownValues: false,
					groups: [SchulconnexResponseValidationGroups.GROUPS],
				});
			});

			it('should validate the response for licenses', async () => {
				const { input, schulconnexPoliciesInfoResponse } = setup();

				await strategy.getData(input);

				expect(validationFunction).toHaveBeenCalledWith(schulconnexPoliciesInfoResponse, {
					always: true,
					forbidUnknownValues: false,
				});
			});

			it('should return the oauth data', async () => {
				const { input, user, school, groups, licenses } = setup();

				const result: OauthDataDto = await strategy.getData(input);

				expect(result).toEqual<OauthDataDto>({
					system: input.system,
					externalUser: user,
					externalSchool: school,
					externalGroups: groups,
					externalLicenses: licenses,
				});
			});
		});

		describe('when FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED is false', () => {
			const setup = () => {
				const provisioningUrl = 'sanisProvisioningUrl';
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl,
					}),
					idToken: 'sanisIdToken',
					accessToken: randomUUID(),
				});
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
				const user: ExternalUserDto = externalUserDtoFactory.build();
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
				});

				config.featureSchulconnexGroupProvisioningEnabled = false;
				config.featureSchulconnexMediaLicenseEnabled = false;
				schulconnexRestClient.getPersonInfo.mockResolvedValueOnce(schulconnexResponse);
				schulconnexResponseMapper.mapToExternalUserDto.mockReturnValue(user);
				schulconnexResponseMapper.mapToExternalSchoolDto.mockReturnValue(school);
				validationFunction.mockResolvedValueOnce([]);

				return {
					input,
					schulconnexResponse,
				};
			};

			it('should not validate the response for groups', async () => {
				const { input, schulconnexResponse } = setup();

				await strategy.getData(input);

				expect(validationFunction).not.toHaveBeenCalledWith(
					schulconnexResponse,
					expect.objectContaining({ groups: [SchulconnexResponseValidationGroups.GROUPS] })
				);
			});

			it('should not call mapToExternalGroupDtos', async () => {
				const { input } = setup();

				await strategy.getData(input);

				expect(schulconnexResponseMapper.mapToExternalGroupDtos).not.toHaveBeenCalled();
			});
		});

		describe('when fetching policies info from schulconnex fails', () => {
			const setup = () => {
				const provisioningUrl = 'sanisProvisioningUrl';
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl,
					}),
					idToken: 'sanisIdToken',
					accessToken: randomUUID(),
				});
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
				const user: ExternalUserDto = externalUserDtoFactory.build();
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
				});

				config.featureSchulconnexGroupProvisioningEnabled = false;
				config.featureSchulconnexMediaLicenseEnabled = true;
				schulconnexRestClient.getPersonInfo.mockResolvedValueOnce(schulconnexResponse);
				schulconnexResponseMapper.mapToExternalUserDto.mockReturnValue(user);
				schulconnexResponseMapper.mapToExternalSchoolDto.mockReturnValue(school);
				validationFunction.mockResolvedValueOnce([]);
				schulconnexRestClient.getPoliciesInfo.mockRejectedValueOnce(new Error());

				return {
					input,
				};
			};

			it('should log a warning', async () => {
				const { input } = setup();

				await strategy.getData(input);

				expect(logger.warning).toHaveBeenCalled();
			});

			it('should return undefined external licenses ', async () => {
				const { input } = setup();

				const oauthDataDto: OauthDataDto = await strategy.getData(input);

				expect(oauthDataDto.externalLicenses).toBeUndefined();
			});
		});

		describe('when FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED is false', () => {
			const setup = () => {
				const provisioningUrl = 'sanisProvisioningUrl';
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl,
					}),
					idToken: 'sanisIdToken',
					accessToken: randomUUID(),
				});
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
				const user: ExternalUserDto = externalUserDtoFactory.build();
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
				});

				config.featureSchulconnexGroupProvisioningEnabled = false;
				config.featureSchulconnexMediaLicenseEnabled = false;
				schulconnexRestClient.getPersonInfo.mockResolvedValueOnce(schulconnexResponse);
				schulconnexResponseMapper.mapToExternalUserDto.mockReturnValue(user);
				schulconnexResponseMapper.mapToExternalSchoolDto.mockReturnValue(school);
				validationFunction.mockResolvedValueOnce([]);
				validationFunction.mockResolvedValueOnce([]);

				return {
					input,
					schulconnexResponse,
				};
			};

			it('should not call getPoliciesInfo', async () => {
				const { input } = setup();

				await strategy.getData(input);

				expect(schulconnexRestClient.getPoliciesInfo).not.toHaveBeenCalled();
			});
		});

		describe('when the provided system has no provisioning url', () => {
			const setup = () => {
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl: undefined,
					}),
					idToken: 'sanisIdToken',
					accessToken: randomUUID(),
				});
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
				const user: ExternalUserDto = externalUserDtoFactory.build();
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
				});
				const sanisGruppeResponse: SchulconnexGruppenResponse = schulconnexResponse.personenkontexte[0].gruppen![0]!;
				const groups: ExternalGroupDto[] = [
					new ExternalGroupDto({
						name: sanisGruppeResponse.gruppe.bezeichnung,
						externalId: sanisGruppeResponse.gruppe.id,
						type: GroupTypes.CLASS,
						user: {
							externalUserId: schulconnexResponse.personenkontexte[0].id,
							roleName: RoleName.TEACHER,
						},
					}),
				];

				schulconnexRestClient.getPersonInfo.mockResolvedValueOnce(schulconnexResponse);
				schulconnexResponseMapper.mapToExternalUserDto.mockReturnValue(user);
				schulconnexResponseMapper.mapToExternalSchoolDto.mockReturnValue(school);
				schulconnexResponseMapper.mapToExternalGroupDtos.mockReturnValue(groups);

				return {
					input,
				};
			};

			it('should throw an InternalServerErrorException', async () => {
				const { input } = setup();

				const promise: Promise<OauthDataDto> = strategy.getData(input);

				await expect(promise).rejects.toThrow(InternalServerErrorException);
			});
		});

		describe('when role from schulconnex is admin', () => {
			const setup = () => {
				const provisioningUrl = 'sanisProvisioningUrl';
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl,
					}),
					idToken: 'sanisIdToken',
					accessToken: randomUUID(),
				});
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
				const user = new ExternalUserDto({
					externalId: 'externalSchoolId',
					roles: [RoleName.ADMINISTRATOR],
				});
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
				});
				const sanisGruppeResponse: SchulconnexGruppenResponse = schulconnexResponse.personenkontexte[0].gruppen![0]!;
				const groups: ExternalGroupDto[] = [
					new ExternalGroupDto({
						name: sanisGruppeResponse.gruppe.bezeichnung,
						externalId: sanisGruppeResponse.gruppe.id,
						type: GroupTypes.CLASS,
						user: {
							externalUserId: schulconnexResponse.personenkontexte[0].id,
							roleName: RoleName.TEACHER,
						},
					}),
				];

				schulconnexRestClient.getPersonInfo.mockResolvedValueOnce(schulconnexResponse);
				schulconnexResponseMapper.mapToExternalUserDto.mockReturnValue(user);
				schulconnexResponseMapper.mapToExternalSchoolDto.mockReturnValue(school);
				schulconnexResponseMapper.mapToExternalGroupDtos.mockReturnValue(groups);
				validationFunction.mockResolvedValueOnce([]);
				validationFunction.mockResolvedValueOnce([]);

				return {
					input,
				};
			};

			it('should add teacher and admin svs role to externalUser', async () => {
				const { input } = setup();

				const result: OauthDataDto = await strategy.getData(input);

				expect(result.externalUser.roles).toEqual(expect.arrayContaining([RoleName.ADMINISTRATOR, RoleName.TEACHER]));
			});
		});

		describe('when policies-info returns at least one error response', () => {
			const setup = () => {
				const provisioningUrl = 'sanisProvisioningUrl';
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl,
					}),
					idToken: 'sanisIdToken',
					accessToken: randomUUID(),
				});
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
				const user: ExternalUserDto = externalUserDtoFactory.build();
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
				});

				const schulconnexPoliciesInfoLicenseResponse = schulconnexPoliciesInfoLicenseResponseFactory.build();
				const schulconnexPoliciesInfoErrorResponse = schulconnexPoliciesInfoErrorResponseFactory.build();

				const schulconnexPoliciesInfoResponse: SchulconnexPoliciesInfoResponse =
					schulconnexPoliciesInfoResponseFactory.build({
						data: [schulconnexPoliciesInfoLicenseResponse, schulconnexPoliciesInfoErrorResponse],
					});

				const licenses: ExternalLicenseDto[] = SchulconnexResponseMapper.mapToExternalLicenses([
					schulconnexPoliciesInfoLicenseResponse,
				]);

				config.featureSchulconnexGroupProvisioningEnabled = false;
				config.featureSchulconnexMediaLicenseEnabled = true;
				schulconnexRestClient.getPersonInfo.mockResolvedValueOnce(schulconnexResponse);
				schulconnexResponseMapper.mapToExternalUserDto.mockReturnValue(user);
				schulconnexResponseMapper.mapToExternalSchoolDto.mockReturnValue(school);
				schulconnexRestClient.getPoliciesInfo.mockResolvedValueOnce(schulconnexPoliciesInfoResponse);
				validationFunction.mockResolvedValue([]);

				return { schulconnexPoliciesInfoErrorResponse, input, licenses };
			};

			it('should log the error response', async () => {
				const { input, schulconnexPoliciesInfoErrorResponse } = setup();

				await strategy.getData(input);

				expect(logger.warning).toHaveBeenCalledWith(
					new PoliciesInfoErrorResponseLoggable(schulconnexPoliciesInfoErrorResponse)
				);
			});

			it('should return the correct licenses', async () => {
				const { input, licenses } = setup();

				const result: OauthDataDto = await strategy.getData(input);

				expect(result.externalLicenses).toEqual(licenses);
				expect(result.externalLicenses).toHaveLength(1);
			});
		});

		describe('when the validation of the response fails', () => {
			const setup = () => {
				const provisioningUrl = 'sanisProvisioningUrl';
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl,
					}),
					idToken: 'schulconnexIdToken',
					accessToken: randomUUID(),
				});
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
				const validationError: classValidator.ValidationError = new classValidator.ValidationError();

				schulconnexRestClient.getPersonInfo.mockResolvedValueOnce(schulconnexResponse);
				validationFunction.mockResolvedValueOnce([validationError]);

				return {
					input,
					provisioningUrl,
					schulconnexResponse,
				};
			};

			it('should throw a validation error', async () => {
				const { input } = setup();

				await expect(strategy.getData(input)).rejects.toThrow(ValidationErrorLoggableException);
			});
		});
	});

	describe('apply', () => {
		describe('when provisioning user and school data', () => {
			const setup = () => {
				const externalUser = externalUserDtoFactory.build();
				const externalSchool = externalSchoolDtoFactory.build();
				const schoolId = new ObjectId().toHexString();
				const oauthData = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: new ObjectId().toHexString(),
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
					}),
					externalSchool,
					externalUser,
				});
				const user = userDoFactory.build({
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
				config.featureSchulconnexGroupProvisioningEnabled = false;
				config.featureSchulconnexMediaLicenseEnabled = false;

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
				const oauthData = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId,
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
					}),
					externalSchool,
					externalUser,
					externalGroups: [externalGroup],
				});
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.buildWithId(
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
				config.featureSchulconnexGroupProvisioningEnabled = true;
				schulconnexGroupProvisioningService.filterExternalGroups.mockResolvedValueOnce([externalGroup]);
				groupService.findGroups.mockResolvedValueOnce({ data: [groupToKeep, groupToRemove], total: 2 });
				config.featureSchulconnexMediaLicenseEnabled = false;

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
				const user = userDoFactory.buildWithId(
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
				config.featureSchulconnexGroupProvisioningEnabled = false;
				config.featureSchulconnexMediaLicenseEnabled = true;

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
				const user = userDoFactory.buildWithId(
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
				config.featureSchulconnexGroupProvisioningEnabled = false;
				config.featureSchulconnexMediaLicenseEnabled = true;

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
				const user = userDoFactory.build({
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
				config.featureSchulconnexGroupProvisioningEnabled = true;

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
