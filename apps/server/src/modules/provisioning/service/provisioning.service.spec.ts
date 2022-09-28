import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SanisProvisioningStrategy } from '@src/modules/provisioning/strategy/sanis/sanis.strategy';
import { IservProvisioningStrategy } from '@src/modules/provisioning/strategy/iserv/iserv.strategy';
import { ProvisioningService } from '@src/modules/provisioning/service/provisioning.service';
import { SystemService } from '@src/modules/system/service/system.service';

describe('ProvisioningService', () => {
	let module: TestingModule;
	let provisioningService: ProvisioningService;

	let systemService: DeepMocked<SystemService>;
	let sanisProvisioningStrategy: DeepMocked<SanisProvisioningStrategy>;
	let iservProvisioningStrategy: DeepMocked<IservProvisioningStrategy>;

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
			],
		}).compile();
		provisioningService = module.get(ProvisioningService);

		systemService = module.get(SystemService);
		sanisProvisioningStrategy = module.get(SanisProvisioningStrategy);
		iservProvisioningStrategy = module.get(IservProvisioningStrategy);
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
		const sanisStrategySystem: SystemDto = new SystemDto({
			type: 'sanis',
			provisioningUrl: 'sanisUrl',
			provisioningStrategy: SystemProvisioningStrategy.SANIS,
		});
		const iservStrategySystem: SystemDto = new SystemDto({
			type: 'iserv',
			provisioningStrategy: SystemProvisioningStrategy.ISERV,
		});

		beforeEach(() => {
			systemService.findById.mockImplementationOnce((id: string): Promise<SystemDto> => {
				if (id === sanisSystemStrategyId) {
					return Promise.resolve(sanisStrategySystem);
				}
				if (id === iservSystemStrategyId) {
					return Promise.resolve(iservStrategySystem);
				}
				return Promise.reject();
			});
		});

		it('should throw error when system does not exists', async () => {
			await expect(provisioningService.process('accessToken', 'idToken', 'no system found')).rejects.toThrow(
				NotFoundException
			);
		});

		it('should apply sanis provisioning strategy', async () => {
			await provisioningService.process('accessToken', 'idToken', sanisSystemStrategyId);

			expect(sanisProvisioningStrategy.apply).toHaveBeenCalled();
		});

		it('should throw if sanis system has no provisioning url', async () => {
			sanisStrategySystem.provisioningUrl = undefined;

			await expect(provisioningService.process('accessToken', 'idToken', sanisSystemStrategyId)).rejects.toThrow(
				InternalServerErrorException
			);
		});

		it('should apply iserv provisioning strategy', async () => {
			await provisioningService.process('accessToken', 'idToken', iservSystemStrategyId);

			expect(iservProvisioningStrategy.apply).toHaveBeenCalled();
		});

		it('should throw error for missing provisioning stratgey', async () => {
			const missingStrategySystem: SystemDto = new SystemDto({
				type: 'unknown',
				provisioningStrategy: 'unknown strategy' as SystemProvisioningStrategy,
			});
			systemService.findById.mockReset();
			systemService.findById.mockResolvedValueOnce(missingStrategySystem);

			await expect(provisioningService.process('accessToken', 'idToken', 'missingStrategySystemId')).rejects.toThrow(
				InternalServerErrorException
			);
		});
	});
});
