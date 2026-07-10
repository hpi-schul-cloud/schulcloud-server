import { BadRequestException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class ExternalIdMissingLoggableException extends BadRequestException implements Loggable {
	constructor(
		private readonly context: string,
		private readonly additionalInfo?: Record<string, unknown>
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'EXTERNAL_ID_MISSING',
			message: `External ID is missing in ${this.context}`,
			stack: this.stack,
			data: {
				context: this.context,
				...this.additionalInfo,
			},
		};
	}
}
