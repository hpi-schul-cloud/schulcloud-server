import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { ProvisioningStrategyMissingLoggableException } from './provisioning-strategy-missing.loggable-exception';

describe(ProvisioningStrategyMissingLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const systemId: EntityId = new ObjectId().toHexString();

			const exception = new ProvisioningStrategyMissingLoggableException(systemId);

			return {
				exception,
				systemId,
			};
		};

		it('should log the correct message', () => {
			const { exception, systemId } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'PROVISIONING_STRATEGY_MISSING',
				message: expect.any(String),
				stack: expect.any(String),
				data: {
					systemId,
				},
			});
		});
	});
});
