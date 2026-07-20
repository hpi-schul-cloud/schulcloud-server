import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';
import { type AnyProvisioningOptions } from '../domain/school-system-options.do';

export class ProvisioningOptionsInvalidTypeLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(
		private readonly expectedType: new () => AnyProvisioningOptions,
		private readonly schoolId: EntityId,
		private readonly systemId: EntityId
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
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
