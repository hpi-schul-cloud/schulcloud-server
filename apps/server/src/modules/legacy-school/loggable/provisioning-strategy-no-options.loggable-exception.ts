import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';

export class ProvisioningStrategyNoOptionsLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly provisioningStrategy: SystemProvisioningStrategy) {
		super();
	}

	public getLogMessage(): LoggableMessage {
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
