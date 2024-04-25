import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { HttpStatus } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BusinessError } from '@shared/common';
import { CustomParameter } from '../custom-parameter.do';

export class ToolParameterRequiredLoggableException extends BusinessError implements Loggable {
	constructor(private readonly toolId: EntityId | undefined, private readonly param: CustomParameter) {
		super(
			{
				type: 'TOOL_PARAMETER_REQUIRED',
				title: 'Parameter is required',
				defaultMessage: 'The parameter is required, but not found in the tool.',
			},
			HttpStatus.BAD_REQUEST,
			{
				param,
				toolId,
			}
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			stack: this.stack,
			type: this.type,
			message: this.message,
			data: {
				parameterName: this.param.name,
				toolId: this.toolId,
			},
		};
	}
}
