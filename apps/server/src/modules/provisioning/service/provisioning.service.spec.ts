import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { oauthDataDtoFactory, provisioningDtoFactory } from '@modules/provisioning/testing';
import { System, SystemService } from '@modules/system';
import { systemFactory } from '@modules/system/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OauthDataDto, OauthDataStrategyInputDto, ProvisioningDto, ProvisioningSystemDto } from '../dto';
import {
	OidcMockProvisioningStrategy,
	SchulconnexAsyncProvisioningStrategy,
	SchulconnexSyncProvisioningStrategy,
} from '../strategy';
import { TspProvisioningStrategy } from '../strategy/tsp/tsp.strategy';
import { provisioningSystemDtoFactory } from '../testing/provisioning-system-dto.factory';
import { ProvisioningService } from './provisioning.service';

describe('ProvisioningService', () => {
	let module: TestingModule;
	let service: ProvisioningService;

	let systemService: DeepMocked<SystemService>;
	let provisioningStrategy: DeepMocked<SchulconnexSyncProvisioningStrategy>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ProvisioningService,
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: SchulconnexSyncProvisioningStrategy,
					useValue: createMock<SchulconnexSyncProvisioningStrategy>({
						getType(): SystemProvisioningStrategy {
							return SystemProvisioningStrategy.SCHULCONNEX_LEGACY;
						},
					}),
				},
				{
					provide: SchulconnexAsyncProvisioningStrategy,
					useValue: createMock<SchulconnexAsyncProvisioningStrategy>({
						getType(): SystemProvisioningStrategy {
							return SystemProvisioningStrategy.SCHULCONNEX_ASYNC;
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
				{
					provide: TspProvisioningStrategy,
					useValue: createMock<TspProvisioningStrategy>({
						getType(): SystemProvisioningStrategy {
							return SystemProvisioningStrategy.TSP;
						},
					}),
				},
			],
		}).compile();

		service = module.get(ProvisioningService);
		systemService = module.get(SystemService);
		provisioningStrategy = module.get(SchulconnexSyncProvisioningStrategy);
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
			provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_LEGACY,
		});
		const provisioningSystemDto: ProvisioningSystemDto = provisioningSystemDtoFactory.build({
			systemId: system.id,
			provisioningUrl: 'https://api.moin.schule/',
			provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_LEGACY,
		});
		const oauthDataDto: OauthDataDto = oauthDataDtoFactory.build({
			system: provisioningSystemDto,
		});
		const provisioningDto: ProvisioningDto = provisioningDtoFactory.build({
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
