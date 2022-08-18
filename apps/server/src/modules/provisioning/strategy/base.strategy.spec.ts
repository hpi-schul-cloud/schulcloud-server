import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotImplementedException } from '@nestjs/common';

class MockStrategy extends ProvisioningStrategy<unknown> {
	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.UNDEFINED;
	}
}

describe('BaseStrategy', () => {
	let baseStrategy: MockStrategy;

	beforeEach(() => {
		baseStrategy = new MockStrategy();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('apply', () => {
		it('should throw not implemented exception', async () => {
			// Act & Assert
			await expect(baseStrategy.apply('')).rejects.toThrow(NotImplementedException);
		});
	});

	describe('getType', () => {
		it('should return strategy type', () => {
			// Act
			const result = baseStrategy.getType();

			// Assert
			expect(result).toEqual(SystemProvisioningStrategy.UNDEFINED);
		});
	});
});
