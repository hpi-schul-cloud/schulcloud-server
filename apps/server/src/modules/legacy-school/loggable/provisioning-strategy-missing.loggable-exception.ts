import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class ProvisioningStrategyMissingLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly systemId: EntityId) {
		super();
	}

	getLogMessage(): LoggableMessage {
		return {
			type: 'PROVISIONING_STRATEGY_MISSING',
			message: 'Systems without a provisioning strategy cannot have provisioning options.',
			stack: this.stack,
			data: {
				systemId: this.systemId,
			},
		};
	}
}
