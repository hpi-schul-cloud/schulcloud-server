import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { System, SystemService } from '@modules/system';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { systemFactory } from '@shared/testing';
import {
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningDto,
	ProvisioningSystemDto,
} from '../dto';
import { IservProvisioningStrategy, OidcMockProvisioningStrategy, SanisProvisioningStrategy } from '../strategy';
import { ProvisioningService } from './provisioning.service';

describe('ProvisioningService', () => {
	let module: TestingModule;
	let service: ProvisioningService;

	let systemService: DeepMocked<SystemService>;
	let provisioningStrategy: DeepMocked<SanisProvisioningStrategy>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ProvisioningService,
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: SanisProvisioningStrategy,
					useValue: createMock<SanisProvisioningStrategy>({
						getType(): SystemProvisioningStrategy {
							return SystemProvisioningStrategy.SANIS;
						},
					}),
				},
				{
					provide: IservProvisioningStrategy,
					useValue: createMock<IservProvisioningStrategy>({
						getType(): SystemProvisioningStrategy {
							return SystemProvisioningStrategy.ISERV;
						},
					}),
				},
				{
					provide: OidcMockProvisioningStrategy,
					useValue: createMock<OidcMockProvisioningStrategy>({
						getType(): SystemProvisioningStrategy {
							return SystemProvisioningStrategy.OIDC;
						},
					}),
				},
			],
		}).compile();

		service = module.get(ProvisioningService);
		systemService = module.get(SystemService);
		provisioningStrategy = module.get(SanisProvisioningStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const setupSystemData = () => {
		const system: System = systemFactory.withOauthConfig().build({
			provisioningUrl: 'https://api.moin.schule/',
			provisioningStrategy: SystemProvisioningStrategy.SANIS,
		});
		const provisioningSystemDto: ProvisioningSystemDto = new ProvisioningSystemDto({
			systemId: system.id,
			provisioningUrl: 'https://api.moin.schule/',
			provisioningStrategy: SystemProvisioningStrategy.SANIS,
		});
		const oauthDataDto: OauthDataDto = new OauthDataDto({
			system: provisioningSystemDto,
			externalUser: new ExternalUserDto({
				externalId: 'externalUserId',
			}),
		});
		const provisioningDto: ProvisioningDto = new ProvisioningDto({
			externalUserId: 'externalUserId',
		});

		return {
			system,
			provisioningSystemDto,
			oauthDataDto,
			provisioningDto,
		};
	};

	describe('getData is called', () => {
		const setup = () => {
			const { system, provisioningSystemDto, oauthDataDto } = setupSystemData();
			const accessToken = 'accessToken';
			const idToken = 'idToken';

			systemService.findByIdOrFail.mockResolvedValue(system);
			provisioningStrategy.getData.mockResolvedValue(oauthDataDto);

			return {
				accessToken,
				idToken,
				system,
				provisioningSystemDto,
				oauthDataDto,
			};
		};

		describe('when the provisioning strategy is found', () => {
			it('should call strategy.getData', async () => {
				const { accessToken, idToken, system, provisioningSystemDto } = setup();

				await service.getData(system.id, idToken, accessToken);

				expect(provisioningStrategy.getData).toHaveBeenCalledWith(
					new OauthDataStrategyInputDto({
						accessToken,
						idToken,
						system: provisioningSystemDto,
					})
				);
			});

			it('should return the oauth data', async () => {
				const { accessToken, idToken, system, oauthDataDto } = setup();

				const result: OauthDataDto = await service.getData(system.id, idToken, accessToken);

				expect(result).toEqual(oauthDataDto);
			});
		});

		describe('when no provisioning strategy is found', () => {
			it('should throw an InternalServerErrorException', async () => {
				const { accessToken, idToken } = setup();
				const systemWithoutStrategy: System = systemFactory.withOauthConfig().build({
					provisioningStrategy: SystemProvisioningStrategy.UNDEFINED,
				});

				systemService.findByIdOrFail.mockResolvedValue(systemWithoutStrategy);

				const promise: Promise<OauthDataDto> = service.getData('systemId', idToken, accessToken);

				await expect(promise).rejects.toThrow(
					new InternalServerErrorException('Provisioning Strategy is not defined.')
				);
			});
		});
	});

	describe('provisionData is called', () => {
		describe('when the provisioning strategy is found', () => {
			it('should call strategy.apply', async () => {
				const { oauthDataDto, provisioningDto } = setupSystemData();
				provisioningStrategy.apply.mockResolvedValue(provisioningDto);

				await service.provisionData(oauthDataDto);

				expect(provisioningStrategy.apply).toHaveBeenCalledWith(oauthDataDto);
			});

			it('should return the provisioning data', async () => {
				const { oauthDataDto, provisioningDto } = setupSystemData();
				provisioningStrategy.apply.mockResolvedValue(provisioningDto);

				const result: ProvisioningDto = await service.provisionData(oauthDataDto);

				expect(result).toEqual(provisioningDto);
			});
		});

		describe('when no provisioning strategy is found', () => {
			it('should throw an InternalServerErrorException', async () => {
				const { oauthDataDto } = setupSystemData();
				oauthDataDto.system.provisioningStrategy = SystemProvisioningStrategy.UNDEFINED;

				const promise: Promise<ProvisioningDto> = service.provisionData(oauthDataDto);

				await expect(promise).rejects.toThrow(InternalServerErrorException);
			});
		});
	});
});
