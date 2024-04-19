import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { HttpStatus } from '@nestjs/common';
import { CustomParameterEntry } from '../custom-parameter-entry.do';

export class ToolParameterUnknownLoggableException extends BusinessError implements Loggable {
	constructor(private readonly parameterEntry: CustomParameterEntry) {
		super(
			{
				type: 'TOOL_PARAMETER_UNKNOWN',
				title: 'Tool parameter unknown',
				defaultMessage: 'The parameter is not part of this tool.',
			},
			HttpStatus.BAD_REQUEST,
			{
				parameterEntry,
			}
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				parameterName: this.parameterEntry.name,
			},
		};
	}
}
