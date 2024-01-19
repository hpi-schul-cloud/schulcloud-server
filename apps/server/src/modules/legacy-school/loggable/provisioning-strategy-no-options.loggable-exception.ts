import { UnprocessableEntityException } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class ProvisioningStrategyNoOptionsLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly provisioningStrategy: SystemProvisioningStrategy) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'PROVISIONING_STRATEGY_NO_OPTIONS',
			message: 'The provisioning strategy does not support options.',
			stack: this.stack,
			data: {
				provisioningStrategy: this.provisioningStrategy,
			},
		};
	}
}
