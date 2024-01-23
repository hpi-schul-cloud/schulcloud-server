import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	SanisGruppenResponse,
	SanisResponse,
	SanisResponseValidationGroups,
	SanisRole,
	schulconnexResponseFactory,
} from '@infra/schulconnex-client';
import { GroupTypes } from '@modules/group/domain';
import { HttpService } from '@nestjs/axios';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationErrorLoggableException } from '@shared/common/loggable-exception';
import { RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { axiosResponseFactory } from '@shared/testing';
import { UUID } from 'bson';
import * as classValidator from 'class-validator';
import { of } from 'rxjs';
import { IProvisioningFeatures, ProvisioningFeatures } from '../../config';
import {
	ExternalGroupDto,
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningSystemDto,
} from '../../dto';
import { OidcProvisioningService } from '../oidc/service/oidc-provisioning.service';
import { SanisResponseMapper } from './sanis-response.mapper';
import { SanisProvisioningStrategy } from './sanis.strategy';
import ArgsType = jest.ArgsType;
import SpyInstance = jest.SpyInstance;

const createAxiosResponse = (data: SanisResponse) =>
	axiosResponseFactory.build({
		data,
	});

describe('SanisStrategy', () => {
	let module: TestingModule;
	let strategy: SanisProvisioningStrategy;

	let mapper: DeepMocked<SanisResponseMapper>;
	let httpService: DeepMocked<HttpService>;

	let validationFunction: SpyInstance<
		ReturnType<typeof classValidator.validate>,
		ArgsType<typeof classValidator.validate>
	>;

	let provisioningFeatures: IProvisioningFeatures;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SanisProvisioningStrategy,
				{
					provide: SanisResponseMapper,
					useValue: createMock<SanisResponseMapper>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: OidcProvisioningService,
					useValue: createMock<OidcProvisioningService>(),
				},
				{
					provide: ProvisioningFeatures,
					useValue: {},
				},
			],
		}).compile();

		strategy = module.get(SanisProvisioningStrategy);
		mapper = module.get(SanisResponseMapper);
		httpService = module.get(HttpService);
		provisioningFeatures = module.get(ProvisioningFeatures);

		validationFunction = jest.spyOn(classValidator, 'validate');
	});

	beforeEach(() => {
		Object.assign<IProvisioningFeatures, Partial<IProvisioningFeatures>>(provisioningFeatures, {
			schulconnexGroupProvisioningEnabled: true,
		});
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const setupSanisResponse = (): SanisResponse => schulconnexResponseFactory.build();

	describe('getType is called', () => {
		describe('when it is called', () => {
			it('should return type SANIS', () => {
				const result: SystemProvisioningStrategy = strategy.getType();

				expect(result).toEqual(SystemProvisioningStrategy.SANIS);
			});
		});
	});

	describe('getData is called', () => {
		describe('when fetching data from sanis', () => {
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
				const sanisResponse: SanisResponse = setupSanisResponse();
				const user: ExternalUserDto = new ExternalUserDto({
					externalId: 'externalUserId',
				});
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
				});
				const sanisGruppeResponse: SanisGruppenResponse = sanisResponse.personenkontexte[0].gruppen![0]!;
				const groups: ExternalGroupDto[] = [
					new ExternalGroupDto({
						name: sanisGruppeResponse.gruppe.bezeichnung,
						externalId: sanisGruppeResponse.gruppe.id,
						type: GroupTypes.CLASS,
						user: {
							externalUserId: sanisResponse.personenkontexte[0].id,
							roleName: RoleName.TEACHER,
						},
					}),
				];

				httpService.get.mockReturnValue(of(createAxiosResponse(sanisResponse)));
				mapper.mapToExternalUserDto.mockReturnValue(user);
				mapper.mapToExternalSchoolDto.mockReturnValue(school);
				mapper.mapToExternalGroupDtos.mockReturnValue(groups);
				validationFunction.mockResolvedValueOnce([]);
				validationFunction.mockResolvedValueOnce([]);

				return {
					input,
					provisioningUrl,
					user,
					school,
					groups,
					sanisResponse,
				};
			};

			it('should make a Http-GET-Request to the provisioning url of sanis with an access token', async () => {
				const { input, provisioningUrl } = setup();

				await strategy.getData(input);

				expect(httpService.get).toHaveBeenCalledWith(
					provisioningUrl,
					expect.objectContaining({
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						headers: expect.objectContaining({ Authorization: 'Bearer sanisAccessToken', 'Accept-Encoding': 'gzip' }),
					})
				);
			});

			it('should accept gzip compressed data', async () => {
				const { input, provisioningUrl } = setup();

				await strategy.getData(input);

				expect(httpService.get).toHaveBeenCalledWith(
					provisioningUrl,
					expect.objectContaining({
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						headers: expect.objectContaining({ 'Accept-Encoding': 'gzip' }),
					})
				);
			});

			it('should validate the response for user and school', async () => {
				const { input, sanisResponse } = setup();

				await strategy.getData(input);

				expect(validationFunction).toHaveBeenCalledWith(sanisResponse, {
					always: true,
					forbidUnknownValues: false,
					groups: [SanisResponseValidationGroups.USER, SanisResponseValidationGroups.SCHOOL],
				});
			});

			it('should validate the response for groups', async () => {
				const { input, sanisResponse } = setup();

				await strategy.getData(input);

				expect(validationFunction).toHaveBeenCalledWith(sanisResponse, {
					always: true,
					forbidUnknownValues: false,
					groups: [SanisResponseValidationGroups.GROUPS],
				});
			});

			it('should return the oauth data', async () => {
				const { input, user, school, groups } = setup();

				const result: OauthDataDto = await strategy.getData(input);

				expect(result).toEqual<OauthDataDto>({
					system: input.system,
					externalUser: user,
					externalSchool: school,
					externalGroups: groups,
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
				const sanisResponse: SanisResponse = setupSanisResponse();
				const user: ExternalUserDto = new ExternalUserDto({
					externalId: 'externalUserId',
				});
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
				});

				httpService.get.mockReturnValue(of(createAxiosResponse(sanisResponse)));
				mapper.mapToExternalUserDto.mockReturnValue(user);
				mapper.mapToExternalSchoolDto.mockReturnValue(school);
				validationFunction.mockResolvedValueOnce([]);

				provisioningFeatures.schulconnexGroupProvisioningEnabled = false;

				return {
					input,
					sanisResponse,
				};
			};

			it('should not validate the response for groups', async () => {
				const { input, sanisResponse } = setup();

				await strategy.getData(input);

				expect(validationFunction).not.toHaveBeenCalledWith(
					sanisResponse,
					expect.objectContaining({ groups: [SanisResponseValidationGroups.GROUPS] })
				);
			});

			it('should not call mapToExternalGroupDtos', async () => {
				const { input } = setup();

				await strategy.getData(input);

				expect(mapper.mapToExternalGroupDtos).not.toHaveBeenCalled();
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
				const sanisResponse: SanisResponse = setupSanisResponse();
				const user: ExternalUserDto = new ExternalUserDto({
					externalId: 'externalUserId',
				});
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
				});
				const sanisGruppeResponse: SanisGruppenResponse = sanisResponse.personenkontexte[0].gruppen![0]!;
				const groups: ExternalGroupDto[] = [
					new ExternalGroupDto({
						name: sanisGruppeResponse.gruppe.bezeichnung,
						externalId: sanisGruppeResponse.gruppe.id,
						type: GroupTypes.CLASS,
						user: {
							externalUserId: sanisResponse.personenkontexte[0].id,
							roleName: RoleName.TEACHER,
						},
					}),
				];

				httpService.get.mockReturnValue(of(createAxiosResponse(sanisResponse)));
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

		describe('when role from sanis is admin', () => {
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
				const sanisResponse: SanisResponse = setupSanisResponse();
				const user = new ExternalUserDto({
					externalId: 'externalSchoolId',
					roles: [RoleName.ADMINISTRATOR],
				});
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
				});
				const sanisGruppeResponse: SanisGruppenResponse = sanisResponse.personenkontexte[0].gruppen![0]!;
				const groups: ExternalGroupDto[] = [
					new ExternalGroupDto({
						name: sanisGruppeResponse.gruppe.bezeichnung,
						externalId: sanisGruppeResponse.gruppe.id,
						type: GroupTypes.CLASS,
						user: {
							externalUserId: sanisResponse.personenkontexte[0].id,
							roleName: RoleName.TEACHER,
						},
					}),
				];

				httpService.get.mockReturnValue(of(createAxiosResponse(sanisResponse)));
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

		describe('when the validation of the response fails', () => {
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
				const sanisResponse: SanisResponse = setupSanisResponse();
				const validationError: classValidator.ValidationError = new classValidator.ValidationError();

				httpService.get.mockReturnValue(of(createAxiosResponse(sanisResponse)));
				validationFunction.mockResolvedValueOnce([validationError]);

				return {
					input,
					provisioningUrl,
					sanisResponse,
				};
			};

			it('should throw a validation error', async () => {
				const { input } = setup();

				await expect(strategy.getData(input)).rejects.toThrow(ValidationErrorLoggableException);
			});
		});

		describe('when the response contains invalid empty objects', () => {
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
				const sanisResponse = {
					pid: 'aef1f4fd-c323-466e-962b-a84354c0e713',
					person: {
						name: {
							vorname: 'Hans',
							familienname: 'Peter',
						},
						geburt: {
							datum: '2023-11-17',
						},
					},
					personenkontexte: [
						{
							id: new UUID().toString(),
							rolle: SanisRole.LEIT,
							organisation: {
								id: new UUID('df66c8e6-cfac-40f7-b35b-0da5d8ee680e').toString(),
								name: 'schoolName',
								kennung: 'Kennung',
								anschrift: {
									ort: 'Hannover',
								},
							},
							gruppen: [
								{
									sonstige_gruppenzugehoerige: [{}],
								},
							],
						},
					],
				};
				const user: ExternalUserDto = new ExternalUserDto({
					externalId: 'externalUserId',
				});
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
				});

				httpService.get.mockReturnValue(of(createAxiosResponse(sanisResponse as SanisResponse)));
				mapper.mapToExternalUserDto.mockReturnValue(user);
				mapper.mapToExternalSchoolDto.mockReturnValue(school);
				mapper.mapToExternalGroupDtos.mockReturnValue(undefined);
				validationFunction.mockRestore();
				validationFunction.mockRestore();

				return {
					input,
					provisioningUrl,
					user,
					school,
					sanisResponse,
				};
			};

			it('should not throw', async () => {
				const { input } = setup();

				await expect(strategy.getData(input)).resolves.not.toThrow();
			});

			it('should return undefined for groups instead of an empty list', async () => {
				const { input } = setup();

				const result: OauthDataDto = await strategy.getData(input);

				expect(result.externalGroups).toBeUndefined();
			});
		});
	});
});
