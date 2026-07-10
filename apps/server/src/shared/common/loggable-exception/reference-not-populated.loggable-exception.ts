import { InternalServerErrorException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '../loggable/interfaces';

export class ReferenceNotPopulatedLoggableException extends InternalServerErrorException implements Loggable {
	constructor(
		private readonly entityName: string,
		private readonly referenceName: string
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'REFERENCE_NOT_POPULATED',
			stack: this.stack,
			data: {
				entityName: this.entityName,
				referenceName: this.referenceName,
			},
		};
	}
}
