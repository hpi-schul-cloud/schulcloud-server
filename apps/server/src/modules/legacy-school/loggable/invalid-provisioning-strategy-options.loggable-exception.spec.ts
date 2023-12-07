import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ProvisioningOptionsInterface } from '../interface';
import { InvalidProvisioningStrategyOptionsLoggableException } from './invalid-provisioning-strategy-options.loggable-exception';

describe(InvalidProvisioningStrategyOptionsLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const provisioningOptions: ProvisioningOptionsInterface = {
				groupProvisioningOtherEnabled: true,
			};

			const exception = new InvalidProvisioningStrategyOptionsLoggableException(
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
				type: 'INVALID_PROVISIONING_STRATEGY_OPTIONS',
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
