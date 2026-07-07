import { UnprocessableEntityException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';

export class ProvisioningStrategyNoOptionsLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly provisioningStrategy: SystemProvisioningStrategy) {
		super();
	}

	getLogMessage(): LoggableMessage {
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
