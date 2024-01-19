import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ProvisioningStrategyNoOptionsLoggableException } from './provisioning-strategy-no-options.loggable-exception';

describe(ProvisioningStrategyNoOptionsLoggableException.name, () => {
	describe('getLogMessage', () => {
		it('should log the correct message', () => {
			const exception = new ProvisioningStrategyNoOptionsLoggableException(SystemProvisioningStrategy.SANIS);

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'PROVISIONING_STRATEGY_NO_OPTIONS',
				message: expect.any(String),
				stack: expect.any(String),
				data: {
					provisioningStrategy: SystemProvisioningStrategy.SANIS,
				},
			});
		});
	});
});
