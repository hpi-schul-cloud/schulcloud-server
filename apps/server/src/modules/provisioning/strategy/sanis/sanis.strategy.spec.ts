import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { HttpService } from '@nestjs/axios';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { axiosResponseFactory, setupEntities } from '@shared/testing';
import { GroupTypes } from '@src/modules/group';
import { UUID } from 'bson';
import { of } from 'rxjs';
import {
	ExternalGroupDto,
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningSystemDto,
} from '../../dto';
import { OidcProvisioningService } from '../oidc/service/oidc-provisioning.service';
import { SanisGroupRole, SanisGroupType, SanisGruppenResponse, SanisResponse, SanisRole } from './response';
import { SanisResponseMapper } from './sanis-response.mapper';
import { SanisProvisioningStrategy } from './sanis.strategy';

const createAxiosResponse = (data: SanisResponse) =>
	axiosResponseFactory.build({
		data,
	});

describe('SanisStrategy', () => {
	let module: TestingModule;
	let strategy: SanisProvisioningStrategy;

	let mapper: DeepMocked<SanisResponseMapper>;
	let httpService: DeepMocked<HttpService>;

	beforeAll(async () => {
		await setupEntities();

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
			],
		}).compile();

		strategy = module.get(SanisProvisioningStrategy);
		mapper = module.get(SanisResponseMapper);
		httpService = module.get(HttpService);
	});

	afterEach(() => {
		jest.resetAllMocks();
		Configuration.set('FEATURE_SANIS_GROUP_PROVISIONING_ENABLED', 'true');
	});

	const setupSanisResponse = () => {
		return {
			pid: 'aef1f4fd-c323-466e-962b-a84354c0e713',
			person: {
				name: {
					vorname: 'Hans',
					familienname: 'Peter',
				},
				geschlecht: 'any',
				lokalisierung: 'sn_ZW',
				vertrauensstufe: '0',
			},
			personenkontexte: [
				{
					id: new UUID().toString(),
					rolle: SanisRole.LEIT,
					organisation: {
						id: new UUID('df66c8e6-cfac-40f7-b35b-0da5d8ee680e').toString(),
						name: 'schoolName',
						typ: 'SCHULE',
						kennung: 'Kennung',
					},
					personenstatus: 'dead',
					gruppen: [
						{
							gruppe: {
								id: new UUID().toString(),
								bezeichnung: 'bezeichnung',
								typ: SanisGroupType.CLASS,
								laufzeit: {
									von: new Date(2023, 1, 8),
									bis: new Date(2024, 7, 31),
								},
								orgid: 'orgid',
							},
							gruppenzugehoerigkeit: {
								rollen: [SanisGroupRole.TEACHER],
							},
							sonstige_gruppenzugehoerige: [
								{
									rollen: [SanisGroupRole.STUDENT],
									ktid: 'ktid',
								},
							],
						},
					],
				},
			],
		};
	};

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
						externalOrganizationId: sanisGruppeResponse.gruppe.orgid,
						from: sanisGruppeResponse.gruppe.laufzeit.von,
						until: sanisGruppeResponse.gruppe.laufzeit.bis,
						users: [
							{
								externalUserId: sanisResponse.personenkontexte[0].id,
								roleName: RoleName.TEACHER,
							},
						],
					}),
				];

				httpService.get.mockReturnValue(of(createAxiosResponse(sanisResponse)));
				mapper.mapToExternalUserDto.mockReturnValue(user);
				mapper.mapToExternalSchoolDto.mockReturnValue(school);
				mapper.mapToExternalGroupDtos.mockReturnValue(groups);

				return {
					input,
					provisioningUrl,
					user,
					school,
					groups,
				};
			};

			it('should make a Http-GET-Request to the provisioning url of sanis with an access token', async () => {
				const { input, provisioningUrl } = setup();

				await strategy.getData(input);

				expect(httpService.get).toHaveBeenCalledWith(
					provisioningUrl,
					expect.objectContaining({
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						headers: expect.objectContaining({ Authorization: 'Bearer sanisAccessToken' }),
					})
				);
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

				Configuration.set('FEATURE_SANIS_GROUP_PROVISIONING_ENABLED', 'false');

				return {
					input,
				};
			};

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
						externalOrganizationId: sanisGruppeResponse.gruppe.orgid,
						from: sanisGruppeResponse.gruppe.laufzeit.von,
						until: sanisGruppeResponse.gruppe.laufzeit.bis,
						users: [
							{
								externalUserId: sanisResponse.personenkontexte[0].id,
								roleName: RoleName.TEACHER,
							},
						],
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
						externalOrganizationId: sanisGruppeResponse.gruppe.orgid,
						from: sanisGruppeResponse.gruppe.laufzeit.von,
						until: sanisGruppeResponse.gruppe.laufzeit.bis,
						users: [
							{
								externalUserId: sanisResponse.personenkontexte[0].id,
								roleName: RoleName.TEACHER,
							},
						],
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

			it('should add teacher and admin svs role to externalUser', async () => {
				const { input } = setup();

				const result: OauthDataDto = await strategy.getData(input);

				expect(result.externalUser.roles).toEqual(expect.arrayContaining([RoleName.ADMINISTRATOR, RoleName.TEACHER]));
			});
		});
	});
});
