import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ProvisioningUc } from '@src/modules/provisioning/uc/provisioning.uc';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { Logger } from '@src/core/logger';
import { HttpException } from '@nestjs/common';
import { SanisProvisioningStrategy } from '@src/modules/provisioning/strategy/sanis/sanis.strategy';

describe('ProvisioningUc', () => {
	let module: TestingModule;
	let provisioningUc: ProvisioningUc;

	let systemUc: DeepMocked<SystemUc>;
	let sanisProvisioningStrategy: DeepMocked<SanisProvisioningStrategy>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ProvisioningUc,
				{
					provide: SystemUc,
					useValue: createMock<SystemUc>(),
				},
				{
					provide: SanisProvisioningStrategy,
					useValue: createMock<SanisProvisioningStrategy>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		provisioningUc = module.get(ProvisioningUc);

		systemUc = module.get(SystemUc);
		sanisProvisioningStrategy = module.get(SanisProvisioningStrategy);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('process', () => {
		const sanisSystemStrategyId = 'sanisSystemId';
		const sanisStrategySystem: SystemDto = new SystemDto({
			type: 'sanis',
			provisioningStrategy: SystemProvisioningStrategy.SANIS,
		});

		beforeEach(() => {
			systemUc.findById.mockImplementationOnce((id: string): Promise<SystemDto> => {
				if (id === sanisSystemStrategyId) {
					return Promise.resolve(sanisStrategySystem);
				}
				return Promise.reject();
			});
		});

		it('should throw error when system does not exists', async () => {
			// Act & Assert
			await expect(provisioningUc.process('accessToken', 'no system found')).rejects.toThrow(HttpException);
		});

		it('should apply sanis provisioning strategy', async () => {
			// Act
			await provisioningUc.process('accessToken', sanisSystemStrategyId);

			// Assert
			expect(sanisProvisioningStrategy.apply).toHaveBeenCalled();
		});

		it('should throw error for missing provisioning stratgey', async () => {
			// Arrange
			const missingStrategySystem: SystemDto = new SystemDto({
				type: 'unknown',
				provisioningStrategy: 'unknown strategy' as SystemProvisioningStrategy,
			});
			systemUc.findById.mockReset();
			systemUc.findById.mockResolvedValueOnce(missingStrategySystem);

			// Act & Assert
			await expect(provisioningUc.process('accessToken', 'missingStrategySystemId')).rejects.toThrow(HttpException);
			expect(logger.error).toHaveBeenCalled();
		});
	});
});
