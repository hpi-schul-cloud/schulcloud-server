import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ProvisioningOptionsInterface } from '../interface';
import { ProvisioningStrategyInvalidOptionsLoggableException } from './provisioning-strategy-invalid-options.loggable-exception';

describe(ProvisioningStrategyInvalidOptionsLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const provisioningOptions: ProvisioningOptionsInterface = {
				groupProvisioningOtherEnabled: true,
			};

			const exception = new ProvisioningStrategyInvalidOptionsLoggableException(
				SystemProvisioningStrategy.SANIS,
				provisioningOptions
			);

			return {
				exception,
				provisioningOptions,
			};
		};

		it('should log the correct message', () => {
			const { exception, provisioningOptions } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'PROVISIONING_STRATEGY_INVALID_OPTIONS',
				message: expect.any(String),
				stack: expect.any(String),
				data: {
					provisioningStrategy: SystemProvisioningStrategy.SANIS,
					provisioningOptions,
				},
			});
		});
	});
});
