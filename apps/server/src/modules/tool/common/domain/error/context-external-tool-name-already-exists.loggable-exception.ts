import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { HttpStatus } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

export class ContextExternalToolNameAlreadyExistsLoggableException extends BusinessError implements Loggable {
	constructor(private readonly toolId: EntityId | undefined, private readonly toolName: string | undefined) {
		super(
			{
				type: 'CONTEXT_EXTERNAL_TOOL_NAME_ALREADY_EXISTS',
				title: 'Toolname already exists',
				defaultMessage:
					'A tool with the same name is already assigned to this course. Tool names must be unique within a course.',
			},
			HttpStatus.BAD_REQUEST,
			{
				toolId,
				toolName,
			}
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				toolId: this.toolId,
				toolName: this.toolName,
			},
		};
	}
}
