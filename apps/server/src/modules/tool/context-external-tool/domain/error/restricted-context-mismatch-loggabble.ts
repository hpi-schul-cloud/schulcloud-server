import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type ToolContextType } from '../../../common/enum';

export class RestrictedContextMismatchLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(
		private readonly externalToolName: string,
		private readonly context: ToolContextType
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
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
