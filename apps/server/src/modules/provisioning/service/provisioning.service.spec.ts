import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemService } from '@src/modules/system/service/system.service';
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
		const systemId = 'sanisSystemId';
		const system: SystemDto = new SystemDto({
			id: systemId,
			type: 'sanis',
			provisioningUrl: 'sanisUrl',
			provisioningStrategy: SystemProvisioningStrategy.SANIS,
		});
		const provisioningSystemDto: ProvisioningSystemDto = new ProvisioningSystemDto({
			systemId,
			provisioningUrl: 'sanisUrl',
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
			systemId,
			system,
			provisioningSystemDto,
			oauthDataDto,
			provisioningDto,
		};
	};

	describe('getData is called', () => {
		const setup = () => {
			const { systemId, system, provisioningSystemDto, oauthDataDto } = setupSystemData();
			const accessToken = 'accessToken';
			const idToken = 'idToken';

			systemService.findById.mockResolvedValue(system);
			provisioningStrategy.getData.mockResolvedValue(oauthDataDto);

			return {
				accessToken,
				idToken,
				systemId,
				system,
				provisioningSystemDto,
				oauthDataDto,
			};
		};

		describe('when the provisioning strategy is found', () => {
			it('should call strategy.getData', async () => {
				const { accessToken, idToken, systemId, provisioningSystemDto } = setup();

				await service.getData(accessToken, idToken, systemId);

				expect(provisioningStrategy.getData).toHaveBeenCalledWith(
					new OauthDataStrategyInputDto({
						accessToken,
						idToken,
						system: provisioningSystemDto,
					})
				);
			});

			it('should return the oauth data', async () => {
				const { accessToken, idToken, systemId, oauthDataDto } = setup();

				const result: OauthDataDto = await service.getData(accessToken, idToken, systemId);

				expect(result).toEqual(oauthDataDto);
			});
		});

		describe('when no provisioning strategy is found', () => {
			it('should throw an InternalServerErrorException', async () => {
				const { accessToken, idToken } = setup();
				const systemWithoutStrategy: SystemDto = new SystemDto({
					type: '',
					provisioningStrategy: SystemProvisioningStrategy.UNDEFINED,
				});

				systemService.findById.mockResolvedValue(systemWithoutStrategy);

				const promise: Promise<OauthDataDto> = service.getData(accessToken, idToken, 'systemId');

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
