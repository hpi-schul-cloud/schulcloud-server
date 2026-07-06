import { InternalServerErrorException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class UnknownQueryTypeLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly unknownQueryType: string) {
		super();
	}

	getLogMessage(): LoggableMessage {
		return {
			type: 'INTERNAL_SERVER_ERROR',
			stack: this.stack,
			message: 'Unable to process unknown query type for class years.',
			data: {
				unknownQueryType: this.unknownQueryType,
			},
		};
	}
}
