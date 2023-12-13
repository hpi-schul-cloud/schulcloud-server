import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { SchulConneXProvisioningOptions } from '../domain';
import { ProvisioningOptionsInvalidTypeLoggableException } from './provisioning-options-invalid-type.loggable-exception';

describe(ProvisioningOptionsInvalidTypeLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const schoolId: EntityId = new ObjectId().toHexString();
			const systemId: EntityId = new ObjectId().toHexString();

			const exception = new ProvisioningOptionsInvalidTypeLoggableException(
				SchulConneXProvisioningOptions,
				schoolId,
				systemId
			);

			return {
				exception,
				schoolId,
				systemId,
			};
		};

		it('should log the correct message', () => {
			const { exception, schoolId, systemId } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'PROVISIONING_OPTIONS_INVALID_TYPE',
				message: expect.any(String),
				stack: expect.any(String),
				data: {
					expectedType: SchulConneXProvisioningOptions.name,
					schoolId,
					systemId,
				},
			});
		});
	});
});
