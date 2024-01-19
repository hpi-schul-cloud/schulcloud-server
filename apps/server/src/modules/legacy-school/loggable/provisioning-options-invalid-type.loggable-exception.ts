import { UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { type AnyProvisioningOptions } from '../domain';

export class ProvisioningOptionsInvalidTypeLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(
		private readonly expectedType: new () => AnyProvisioningOptions,
		private readonly schoolId: EntityId,
		private readonly systemId: EntityId
	) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'PROVISIONING_OPTIONS_INVALID_TYPE',
			message: 'The provisioning options are not of the expected type.',
			stack: this.stack,
			data: {
				expectedType: this.expectedType.name,
				schoolId: this.schoolId,
				systemId: this.systemId,
			},
		};
	}
}
