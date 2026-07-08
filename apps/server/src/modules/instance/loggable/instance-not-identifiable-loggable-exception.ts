import { InternalServerErrorException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class InstanceNotIdentifiableLoggableException extends InternalServerErrorException implements Loggable {
	getLogMessage(): LoggableMessage {
		return {
			type: 'INSTANCE_NOT_IDENTIFIABLE',
			stack: this.stack,
			message: 'Instance could not be identified.',
		};
	}
}
