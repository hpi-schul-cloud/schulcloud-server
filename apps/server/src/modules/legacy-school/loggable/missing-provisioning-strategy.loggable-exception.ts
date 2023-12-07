import { UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class MissingProvisioningStrategyLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly systemId: EntityId) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'MISSING_PROVISIONING_STRATEGY',
			message: 'Systems without a provisioning strategy cannot have provisioning options.',
			stack: this.stack,
			data: {
				systemId: this.systemId,
			},
		};
	}
}
