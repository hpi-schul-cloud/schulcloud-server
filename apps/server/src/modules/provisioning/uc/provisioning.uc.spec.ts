import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ProvisioningUc } from '@src/modules/provisioning/uc/provisioning.uc';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { UnknownProvisioningStrategy } from '@src/modules/provisioning/strategy/unknown/unknown.strategy';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { Logger } from '@src/core/logger';
import { HttpException } from '@nestjs/common';

describe('ProvisioningUc', () => {
	let module: TestingModule;
	let provisioningUc: ProvisioningUc;

	let systemUc: DeepMocked<SystemUc>;
	let unknownStrategy: DeepMocked<UnknownProvisioningStrategy>;
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
					provide: UnknownProvisioningStrategy,
					useValue: createMock<UnknownProvisioningStrategy>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		provisioningUc = module.get(ProvisioningUc);

		systemUc = module.get(SystemUc);
		unknownStrategy = module.get(UnknownProvisioningStrategy);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('process', () => {
		const unknownSystemStrategyId = 'unknownSystemId';
		const unknownStrategySystem: SystemDto = new SystemDto({
			type: 'unknown',
			provisioningStrategy: SystemProvisioningStrategy.UNKNOWN,
		});

		beforeEach(() => {
			systemUc.findById.mockImplementationOnce((id: string): Promise<SystemDto> => {
				if (id === unknownSystemStrategyId) {
					return Promise.resolve(unknownStrategySystem);
				}
				return Promise.reject();
			});
		});

		it('should throw error when system does not exists', async () => {
			// Act & Assert
			await expect(provisioningUc.process('sub', 'no system found')).rejects.toThrow(HttpException);
		});

		it('should apply "unknown" provisioning strategy', async () => {
			// Act
			await provisioningUc.process('sub', unknownSystemStrategyId);

			// Assert
			expect(unknownStrategy.apply).toHaveBeenCalled();
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
			await expect(provisioningUc.process('sub', 'missingStrategySystemId')).rejects.toThrow(HttpException);
			expect(logger.error).toHaveBeenCalled();
		});
	});
});
