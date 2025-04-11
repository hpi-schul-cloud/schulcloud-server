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
import { GroupTypes } from '@modules/group/domain';
import { RoleName } from '@modules/role';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationErrorLoggableException } from '@shared/common/loggable-exception';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import * as classValidator from 'class-validator';
import { randomUUID } from 'crypto';
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
import { ProvisioningConfig } from '../../provisioning.config';
import { externalUserDtoFactory } from '../../testing';
import { SchulconnexBaseProvisioningStrategy } from './schulconnex-base-provisioning.strategy';
import { SchulconnexResponseMapper } from './schulconnex-response-mapper';
import ArgsType = jest.ArgsType;
import SpyInstance = jest.SpyInstance;

@Injectable()
class TestClass extends SchulconnexBaseProvisioningStrategy {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	apply(data: OauthDataDto): Promise<ProvisioningDto> {
		return Promise.resolve(new ProvisioningDto({ externalUserId: new ObjectId().toHexString() }));
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.SCHULCONNEX_LEGACY;
	}
}

describe(SchulconnexBaseProvisioningStrategy.name, () => {
	let module: TestingModule;
	let strategy: SchulconnexBaseProvisioningStrategy;

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
				TestClass,
				{
					provide: SchulconnexResponseMapper,
					useValue: createMock<SchulconnexResponseMapper>(),
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

		strategy = module.get(TestClass);
		mapper = module.get(SchulconnexResponseMapper);
		schulconnexRestClient = module.get(SchulconnexRestClient);
		logger = module.get(Logger);

		validationFunction = jest.spyOn(classValidator, 'validate');
	});

	afterEach(() => {
		jest.clearAllMocks();
		validationFunction.mockReset();
		config.FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED = false;
		config.FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED = false;
	});

	describe('getData is called', () => {
		describe('when fetching data from schulconnex', () => {
			const setup = () => {
				const provisioningUrl = 'sanisProvisioningUrl';
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_LEGACY,
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

				config.FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED = true;
				config.FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED = true;
				schulconnexRestClient.getPersonInfo.mockResolvedValueOnce(schulconnexResponse);
				mapper.mapToExternalUserDto.mockReturnValue(user);
				mapper.mapToExternalSchoolDto.mockReturnValue(school);
				mapper.mapToExternalGroupDtos.mockReturnValue(groups);
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
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_LEGACY,
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

				schulconnexRestClient.getPersonInfo.mockResolvedValueOnce(schulconnexResponse);
				mapper.mapToExternalUserDto.mockReturnValue(user);
				mapper.mapToExternalSchoolDto.mockReturnValue(school);
				validationFunction.mockResolvedValueOnce([]);

				config.FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED = false;

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
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_LEGACY,
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
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_LEGACY,
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
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_LEGACY,
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
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_LEGACY,
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
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_LEGACY,
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

				config.FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED = true;
				schulconnexRestClient.getPersonInfo.mockResolvedValueOnce(schulconnexResponse);
				mapper.mapToExternalUserDto.mockReturnValue(user);
				mapper.mapToExternalSchoolDto.mockReturnValue(school);
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
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_LEGACY,
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
});
