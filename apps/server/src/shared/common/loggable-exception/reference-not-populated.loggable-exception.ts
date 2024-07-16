import { InternalServerErrorException } from '@nestjs/common';
import { Loggable } from '@src/core/logger';

export class ReferenceNotPopulatedLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly entityName: string, private readonly referenceName: string) {
		super();
	}

	getLogMessage() {
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
