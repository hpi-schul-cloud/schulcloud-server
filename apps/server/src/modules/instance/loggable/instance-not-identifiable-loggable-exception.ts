import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@infra/logger';
import { InternalServerErrorException } from '@nestjs/common';

export class InstanceNotIdentifiableLoggableException extends InternalServerErrorException implements Loggable {
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'INSTANCE_NOT_IDENTIFIABLE',
			stack: this.stack,
			message: 'Instance could not be identified.',
		};
	}
}
