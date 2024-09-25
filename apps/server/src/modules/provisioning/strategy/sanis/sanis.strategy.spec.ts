import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	SchulconnexGruppenResponse,
	SchulconnexPoliciesInfoAccessControlResponse,
	SchulconnexResponse,
	schulconnexResponseFactory,
	SchulconnexResponseValidationGroups,
	SchulconnexRestClient,
} from '@infra/schulconnex-client';
import { SchulconnexPoliciesInfoResponse } from '@infra/schulconnex-client/response';
import { schulconnexPoliciesInfoResponseFactory } from '@infra/schulconnex-client/testing/schulconnex-policies-info-response-factory';
import { GroupService } from '@modules/group';
import { GroupTypes } from '@modules/group/domain';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationErrorLoggableException } from '@shared/common/loggable-exception';
import { PoliciesInfoErrorResponseLoggable } from '@shared/common/loggable/policies-info-error-response-loggable';
import { RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { Logger } from '@src/core/logger';
import * as classValidator from 'class-validator';
import {
	ExternalGroupDto,
	ExternalLicenseDto,
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningSystemDto,
} from '../../dto';
import { ProvisioningConfig } from '../../provisioning.config';
import {
	SchulconnexCourseSyncService,
	SchulconnexGroupProvisioningService,
	SchulconnexLicenseProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexToolProvisioningService,
	SchulconnexUserProvisioningService,
} from '../oidc/service';
import { SanisProvisioningStrategy } from './sanis.strategy';
import { SchulconnexResponseMapper } from './schulconnex-response-mapper';
import ArgsType = jest.ArgsType;
import SpyInstance = jest.SpyInstance;

describe(SanisProvisioningStrategy.name, () => {
	let module: TestingModule;
	let strategy: SanisProvisioningStrategy;

	let mapper: DeepMocked<SchulconnexResponseMapper>;
	let logger: DeepMocked<Logger>;

	let validationFunction: SpyInstance<
		ReturnType<typeof classValidator.validate>,
		ArgsType<typeof classValidator.validate>
	>;

	let schulconnexRestClient: DeepMocked<SchulconnexRestClient>;
	const config: Partial<ProvisioningConfig> = {};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SanisProvisioningStrategy,
				{
					provide: SchulconnexResponseMapper,
					useValue: createMock<SchulconnexResponseMapper>(),
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
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
				{
					provide: SchulconnexLicenseProvisioningService,
					useValue: createMock<SchulconnexLicenseProvisioningService>(),
				},
				{
					provide: SchulconnexToolProvisioningService,
					useValue: createMock<SchulconnexToolProvisioningService>(),
				},
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn().mockImplementation((key: keyof ProvisioningConfig) => config[key]),
					},
				},
				{
					provide: SchulconnexRestClient,
					useValue: createMock<SchulconnexRestClient>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		strategy = module.get(SanisProvisioningStrategy);
		mapper = module.get(SchulconnexResponseMapper);
		schulconnexRestClient = module.get(SchulconnexRestClient);
		logger = module.get(Logger);

		validationFunction = jest.spyOn(classValidator, 'validate');
	});

	afterEach(() => {
		jest.clearAllMocks();
		validationFunction.mockReset();
		config.FEATURE_SANIS_GROUP_PROVISIONING_ENABLED = false;
		config.FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED = false;
	});

	const setupSchulconnexResponse = (): SchulconnexResponse => schulconnexResponseFactory.build();

	describe('getType is called', () => {
		describe('when it is called', () => {
			it('should return type SANIS', () => {
				const result: SystemProvisioningStrategy = strategy.getType();

				expect(result).toEqual(SystemProvisioningStrategy.SANIS);
			});
		});
	});

	describe('getData is called', () => {
		describe('when fetching data from schulconnex', () => {
			const setup = () => {
				const provisioningUrl = 'sanisProvisioningUrl';
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
						provisioningUrl,
					}),
					idToken: 'sanisIdToken',
					accessToken: 'sanisAccessToken',
				});
				const schulconnexResponse: SchulconnexResponse = setupSchulconnexResponse();
				const user: ExternalUserDto = new ExternalUserDto({
					externalId: 'externalUserId',
				});
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
				const schulconnexLizenzInfoResponses: SchulconnexPoliciesInfoResponse[] =
					schulconnexPoliciesInfoResponseFactory.buildList(1);
				const schulconnexLizenzInfoResponse = schulconnexLizenzInfoResponses[0];
				const licenses: ExternalLicenseDto[] = SchulconnexResponseMapper.mapToExternalLicenses([
					schulconnexLizenzInfoResponse,
				]);

				config.FEATURE_SANIS_GROUP_PROVISIONING_ENABLED = true;
				config.FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED = true;
				schulconnexRestClient.getPersonInfo.mockResolvedValueOnce(schulconnexResponse);
				mapper.mapToExternalUserDto.mockReturnValue(user);
				mapper.mapToExternalSchoolDto.mockReturnValue(school);
				mapper.mapToExternalGroupDtos.mockReturnValue(groups);
				validationFunction.mockResolvedValueOnce([]);
				validationFunction.mockResolvedValueOnce([]);
				schulconnexRestClient.getPoliciesInfo.mockResolvedValueOnce(schulconnexLizenzInfoResponses);
				validationFunction.mockResolvedValueOnce([]);

				return {
					input,
					provisioningUrl,
					user,
					school,
					groups,
					licenses,
					schulconnexResponse,
					schulconnexLizenzInfoResponse,
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
				const { input, schulconnexLizenzInfoResponse } = setup();

				await strategy.getData(input);

				expect(validationFunction).toHaveBeenCalledWith(schulconnexLizenzInfoResponse, {
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

		describe('when FEATURE_SANIS_GROUP_PROVISIONING_ENABLED is false', () => {
			const setup = () => {
				const provisioningUrl = 'sanisProvisioningUrl';
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
						provisioningUrl,
					}),
					idToken: 'sanisIdToken',
					accessToken: 'sanisAccessToken',
				});
				const schulconnexResponse: SchulconnexResponse = setupSchulconnexResponse();
				const user: ExternalUserDto = new ExternalUserDto({
					externalId: 'externalUserId',
				});
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
				});

				schulconnexRestClient.getPersonInfo.mockResolvedValueOnce(schulconnexResponse);
				mapper.mapToExternalUserDto.mockReturnValue(user);
				mapper.mapToExternalSchoolDto.mockReturnValue(school);
				validationFunction.mockResolvedValueOnce([]);

				config.FEATURE_SANIS_GROUP_PROVISIONING_ENABLED = false;

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

				expect(mapper.mapToExternalGroupDtos).not.toHaveBeenCalled();
			});
		});

		describe('when fetching policies info from schulconnex fails', () => {
			const setup = () => {
				const provisioningUrl = 'sanisProvisioningUrl';
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
						provisioningUrl,
					}),
					idToken: 'sanisIdToken',
					accessToken: 'sanisAccessToken',
				});
				const schulconnexResponse: SchulconnexResponse = setupSchulconnexResponse();
				const user: ExternalUserDto = new ExternalUserDto({
					externalId: 'externalUserId',
				});
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
				});

				schulconnexRestClient.getPersonInfo.mockResolvedValueOnce(schulconnexResponse);
				mapper.mapToExternalUserDto.mockReturnValue(user);
				mapper.mapToExternalSchoolDto.mockReturnValue(school);
				validationFunction.mockResolvedValueOnce([]);
				schulconnexRestClient.getPoliciesInfo.mockRejectedValueOnce(new Error());

				config.FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED = true;

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
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
						provisioningUrl,
					}),
					idToken: 'sanisIdToken',
					accessToken: 'sanisAccessToken',
				});
				const schulconnexResponse: SchulconnexResponse = setupSchulconnexResponse();
				const user: ExternalUserDto = new ExternalUserDto({
					externalId: 'externalUserId',
				});
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
				});

				schulconnexRestClient.getPersonInfo.mockResolvedValueOnce(schulconnexResponse);
				mapper.mapToExternalUserDto.mockReturnValue(user);
				mapper.mapToExternalSchoolDto.mockReturnValue(school);
				validationFunction.mockResolvedValueOnce([]);
				validationFunction.mockResolvedValueOnce([]);

				config.FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED = false;

				return {
					input,
					schulconnexResponse,
				};
			};

			it('should not call getLizenzInfo', async () => {
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
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
						provisioningUrl: undefined,
					}),
					idToken: 'sanisIdToken',
					accessToken: 'sanisAccessToken',
				});
				const schulconnexResponse: SchulconnexResponse = setupSchulconnexResponse();
				const user: ExternalUserDto = new ExternalUserDto({
					externalId: 'externalUserId',
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
				mapper.mapToExternalUserDto.mockReturnValue(user);
				mapper.mapToExternalSchoolDto.mockReturnValue(school);
				mapper.mapToExternalGroupDtos.mockReturnValue(groups);

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
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
						provisioningUrl,
					}),
					idToken: 'sanisIdToken',
					accessToken: 'sanisAccessToken',
				});
				const schulconnexResponse: SchulconnexResponse = setupSchulconnexResponse();
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
				mapper.mapToExternalUserDto.mockReturnValue(user);
				mapper.mapToExternalSchoolDto.mockReturnValue(school);
				mapper.mapToExternalGroupDtos.mockReturnValue(groups);
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
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
						provisioningUrl,
					}),
					idToken: 'sanisIdToken',
					accessToken: 'sanisAccessToken',
				});
				const schulconnexResponse: SchulconnexResponse = setupSchulconnexResponse();
				const user: ExternalUserDto = new ExternalUserDto({
					externalId: 'externalUserId',
				});
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
				});

				const schulconnexLizenzInfoResponses: SchulconnexPoliciesInfoResponse[] =
					schulconnexPoliciesInfoResponseFactory.buildList(3);

				const errorResponse: SchulconnexPoliciesInfoAccessControlResponse = {
					'@type': 'bilo error mock',
					error: { code: '500', value: 'something went wrong' },
				};
				schulconnexLizenzInfoResponses[1].target = undefined;
				schulconnexLizenzInfoResponses[1].access_control = errorResponse;

				const licenses: ExternalLicenseDto[] =
					SchulconnexResponseMapper.mapToExternalLicenses(schulconnexLizenzInfoResponses);

				const loggable: PoliciesInfoErrorResponseLoggable = new PoliciesInfoErrorResponseLoggable(
					schulconnexLizenzInfoResponses[1].access_control['@type'],
					schulconnexLizenzInfoResponses[1].access_control.error.code,
					schulconnexLizenzInfoResponses[1].access_control.error.value
				);

				config.FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED = true;
				schulconnexRestClient.getPersonInfo.mockResolvedValueOnce(schulconnexResponse);
				mapper.mapToExternalUserDto.mockReturnValue(user);
				mapper.mapToExternalSchoolDto.mockReturnValue(school);
				schulconnexRestClient.getPoliciesInfo.mockResolvedValueOnce(schulconnexLizenzInfoResponses);
				validationFunction.mockResolvedValue([]);

				return { loggable, input, licenses };
			};

			it('should log the error response', async () => {
				const { input, loggable } = setup();

				await strategy.getData(input);

				expect(logger.info).toHaveBeenCalledWith(loggable);
			});

			it('should return the correct licenses', async () => {
				const { input, licenses } = setup();

				const result: OauthDataDto = await strategy.getData(input);

				expect(result.externalLicenses).toEqual(licenses);
				expect(result.externalLicenses).toHaveLength(2);
			});
		});

		describe('when the validation of the response fails', () => {
			const setup = () => {
				const provisioningUrl = 'sanisProvisioningUrl';
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
						provisioningUrl,
					}),
					idToken: 'schulconnexIdToken',
					accessToken: 'schulconnexAccessToken',
				});
				const schulconnexResponse: SchulconnexResponse = setupSchulconnexResponse();
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
});
