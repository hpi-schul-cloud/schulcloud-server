import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
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
			await expect(baseStrategy.apply({ accessToken: '' })).rejects.toThrow(NotImplementedException);
		});
	});

	describe('getType', () => {
		it('should return strategy type', () => {
			const result = baseStrategy.getType();

			expect(result).toEqual(SystemProvisioningStrategy.UNDEFINED);
		});
	});
});
