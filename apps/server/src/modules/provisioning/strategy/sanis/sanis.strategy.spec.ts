import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { axiosResponseFactory, setupEntities } from '@shared/testing';
import { UUID } from 'bson';
import { of } from 'rxjs';
import {
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningSystemDto,
} from '../../dto';
import { OidcProvisioningService } from '../oidc/service/oidc-provisioning.service';
import { SanisResponseMapper } from './sanis-response.mapper';
import {
	SanisResponse,
	SanisResponseName,
	SanisResponseOrganisation,
	SanisResponsePersonenkontext,
	SanisRole,
} from './sanis.response';
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
	});

	describe('getType is called', () => {
		describe('when it is called', () => {
			it('should return type SANIS', () => {
				const result: SystemProvisioningStrategy = strategy.getType();

				expect(result).toEqual(SystemProvisioningStrategy.SANIS);
			});
		});
	});

	describe('getData is called', () => {
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
			const sanisResponse: SanisResponse = new SanisResponse({
				pid: 'aef1f4fd-c323-466e-962b-a84354c0e713',
				person: {
					name: new SanisResponseName({
						vorname: 'Hans',
						familienname: 'Peter',
					}),
					geschlecht: 'any',
					lokalisierung: 'sn_ZW',
					vertrauensstufe: '0',
				},
				personenkontexte: [
					new SanisResponsePersonenkontext({
						id: new UUID(),
						rolle: SanisRole.LEIT,
						organisation: new SanisResponseOrganisation({
							id: new UUID('df66c8e6-cfac-40f7-b35b-0da5d8ee680e'),
							name: 'schoolName',
							typ: 'SCHULE',
							kennung: 'Kennung',
						}),
						personenstatus: 'dead',
						email: 'test@te.st',
					}),
				],
			});
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

			return {
				input,
				provisioningUrl,
				user,
				school,
			};
		};

		describe('when fetching data from sanis', () => {
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
				const { input, user, school } = setup();

				const result: OauthDataDto = await strategy.getData(input);

				expect(result).toEqual<OauthDataDto>({
					system: input.system,
					externalUser: user,
					externalSchool: school,
				});
			});
		});

		describe('when the provided system has no provisioning url', () => {
			it('should throw an InternalServerErrorException', async () => {
				const { input } = setup();
				input.system.provisioningUrl = undefined;

				const promise: Promise<OauthDataDto> = strategy.getData(input);

				await expect(promise).rejects.toThrow(InternalServerErrorException);
			});
		});

		describe('when role from sanis is admin', () => {
			it('should add teacher and admin svs role to externalUser', async () => {
				const { input } = setup();
				const user = new ExternalUserDto({
					externalId: 'externalSchoolId',
					roles: [RoleName.ADMINISTRATOR],
				});
				mapper.mapToExternalUserDto.mockReturnValue(user);

				const result: OauthDataDto = await strategy.getData(input);

				expect(result.externalUser.roles).toEqual(expect.arrayContaining([RoleName.ADMINISTRATOR, RoleName.TEACHER]));
			});
		});
	});
});
