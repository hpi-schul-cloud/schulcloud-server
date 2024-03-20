import { ValidationError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { CustomParameterEntry } from '../custom-parameter-entry.do';

export class ToolParameterUnknownLoggableException extends ValidationError implements Loggable {
	constructor(private readonly parameterEntry: CustomParameterEntry) {
		super(`tool_param_unknown: The parameter with name ${parameterEntry.name} is not part of this tool.`);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'TOOL_PARAMETER_UNKNOWN',
			message: 'The parameter is not part of this tool.',
			stack: this.stack,
			data: {
				parameterName: this.parameterEntry.name,
			},
		};
	}
}
