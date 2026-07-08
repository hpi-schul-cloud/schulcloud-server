import { NotFoundException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class ExternalToolLogoNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly externalToolId: string) {
		super();
	}

	getLogMessage(): LoggableMessage {
		return {
			type: 'EXTERNAL_TOOL_LOGO_NOT_FOUND',
			message: 'External tool logo not found',
			stack: this.stack,
			data: {
				externalToolId: this.externalToolId,
			},
		};
	}
}
