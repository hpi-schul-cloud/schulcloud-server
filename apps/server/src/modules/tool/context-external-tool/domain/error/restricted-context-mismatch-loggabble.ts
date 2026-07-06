import { UnprocessableEntityException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { ToolContextType } from '../../../common/enum';

export class RestrictedContextMismatchLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(
		private readonly externalToolName: string,
		private readonly context: ToolContextType
	) {
		super();
	}

	getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: 'UNPROCESSABLE_ENTITY_EXCEPTION',
			message: `Could not create an instance of ${this.externalToolName} in context: ${this.context} because of the context restrictions of the tool.`,
			stack: this.stack,
			data: {
				externalToolName: this.externalToolName,
				context: this.context,
			},
		};

		return message;
	}
}
