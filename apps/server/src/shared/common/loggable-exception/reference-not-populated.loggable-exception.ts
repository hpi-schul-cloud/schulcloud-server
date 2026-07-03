import { ErrorLogMessage, Loggable } from '@infra/logger';
import { InternalServerErrorException } from '@nestjs/common';

export class ReferenceNotPopulatedLoggableException extends InternalServerErrorException implements Loggable {
	constructor(
		private readonly entityName: string,
		private readonly referenceName: string
	) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
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
