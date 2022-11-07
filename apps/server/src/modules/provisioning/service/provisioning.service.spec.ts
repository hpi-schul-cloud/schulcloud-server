import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SanisProvisioningStrategy } from '@src/modules/provisioning/strategy/sanis/sanis.strategy';
import { IservProvisioningStrategy } from '@src/modules/provisioning/strategy/iserv/iserv.strategy';
import { OidcProvisioningStrategy } from '@src/modules/provisioning/strategy/oidc/oidc.strategy';
import { ProvisioningService } from '@src/modules/provisioning/service/provisioning.service';
import { SystemService } from '@src/modules/system/service/system.service';

describe('ProvisioningService', () => {
	let module: TestingModule;
	let provisioningService: ProvisioningService;

	let systemService: DeepMocked<SystemService>;
	let sanisProvisioningStrategy: DeepMocked<SanisProvisioningStrategy>;
	let iservProvisioningStrategy: DeepMocked<IservProvisioningStrategy>;
	let oidcProvisioningStrategy: DeepMocked<OidcProvisioningStrategy>;

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
					useValue: createMock<SanisProvisioningStrategy>(),
				},
				{
					provide: IservProvisioningStrategy,
					useValue: createMock<IservProvisioningStrategy>(),
				},
				{
					provide: OidcProvisioningStrategy,
					useValue: createMock<OidcProvisioningStrategy>(),
				},
			],
		}).compile();
		provisioningService = module.get(ProvisioningService);

		systemService = module.get(SystemService);
		sanisProvisioningStrategy = module.get(SanisProvisioningStrategy);
		iservProvisioningStrategy = module.get(IservProvisioningStrategy);
		oidcProvisioningStrategy = module.get(OidcProvisioningStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('process', () => {
		const sanisSystemStrategyId = 'sanisSystemId';
		const iservSystemStrategyId = 'iservSystemId';
		const oidcSystemStrategyId = 'oidcSystemId';

		const sanisStrategySystem: SystemDto = new SystemDto({
			type: 'sanis',
			provisioningUrl: 'sanisUrl',
			provisioningStrategy: SystemProvisioningStrategy.SANIS,
		});
		const iservStrategySystem: SystemDto = new SystemDto({
			type: 'iserv',
			provisioningStrategy: SystemProvisioningStrategy.ISERV,
		});
		const oidcStrategySystem: SystemDto = new SystemDto({
			type: 'oidc',
			provisioningStrategy: SystemProvisioningStrategy.OIDC,
		});

		it('should throw error when system does not exists', async () => {
			systemService.findById.mockRejectedValue(NotFoundException);

			const process = () => provisioningService.process('accessToken', 'idToken', 'no system found');

			await expect(process()).rejects.toThrow(NotFoundException);
		});

		it('should apply sanis provisioning strategy', async () => {
			systemService.findById.mockResolvedValue(sanisStrategySystem);

			await provisioningService.process('accessToken', 'idToken', sanisSystemStrategyId);

			expect(sanisProvisioningStrategy.apply).toHaveBeenCalled();
		});

		it('should throw error when sanis system has no provisioning url', async () => {
			sanisStrategySystem.provisioningUrl = undefined;
			systemService.findById.mockResolvedValue(sanisStrategySystem);

			const process = () => provisioningService.process('accessToken', 'idToken', sanisSystemStrategyId);

			await expect(process()).rejects.toThrow(InternalServerErrorException);
		});

		it('should apply iserv provisioning strategy', async () => {
			systemService.findById.mockResolvedValue(iservStrategySystem);

			await provisioningService.process('accessToken', 'idToken', iservSystemStrategyId);

			expect(iservProvisioningStrategy.apply).toHaveBeenCalled();
		});

		it('should apply oidc provisioning strategy', async () => {
			systemService.findById.mockResolvedValue(oidcStrategySystem);

			await provisioningService.process('accessToken', 'idToken', oidcSystemStrategyId);

			expect(oidcProvisioningStrategy.apply).toHaveBeenCalled();
		});

		it('should throw error when provisioning stratgey is missing', async () => {
			const missingStrategySystem: SystemDto = new SystemDto({
				type: 'unknown',
				provisioningStrategy: 'unknown strategy' as SystemProvisioningStrategy,
			});
			systemService.findById.mockReset();
			systemService.findById.mockResolvedValueOnce(missingStrategySystem);
			const process = () => provisioningService.process('accessToken', 'idToken', 'missingStrategySystemId');

			await expect(process()).rejects.toThrow(InternalServerErrorException);
		});
	});
});
