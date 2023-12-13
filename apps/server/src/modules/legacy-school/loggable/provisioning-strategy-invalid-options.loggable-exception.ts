import { UnprocessableEntityException } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { ProvisioningOptionsInterface } from '../interface';

export class ProvisioningStrategyInvalidOptionsLoggableException
	extends UnprocessableEntityException
	implements Loggable
{
	constructor(
		private readonly provisioningStrategy: SystemProvisioningStrategy,
		private readonly provisioningOptions: ProvisioningOptionsInterface
	) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'PROVISIONING_STRATEGY_INVALID_OPTIONS',
			message: 'The provisioning options are invalid for this strategy type.',
			stack: this.stack,
			data: {
				provisioningStrategy: this.provisioningStrategy,
				provisioningOptions: this.provisioningOptions,
			},
		};
	}
}
