import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { MissingProvisioningStrategyLoggableException } from './missing-provisioning-strategy.loggable-exception';

describe(MissingProvisioningStrategyLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const systemId: EntityId = new ObjectId().toHexString();

			const exception = new MissingProvisioningStrategyLoggableException(systemId);

			return {
				exception,
				systemId,
			};
		};

		it('should log the correct message', () => {
			const { exception, systemId } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'MISSING_PROVISIONING_STRATEGY',
				message: expect.any(String),
				stack: expect.any(String),
				data: {
					systemId,
				},
			});
		});
	});
});
