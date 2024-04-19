import { UnprocessableEntityException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { ToolContextType } from '../../../common/enum';

export class RestrictedContextMismatchLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly externalToolName: string, private readonly context: ToolContextType) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const message: LogMessage | ErrorLogMessage | ValidationErrorLogMessage = {
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
