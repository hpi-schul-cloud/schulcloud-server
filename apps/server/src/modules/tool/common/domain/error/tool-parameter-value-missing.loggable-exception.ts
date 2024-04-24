import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { BusinessError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import { HttpStatus } from '@nestjs/common';
import { CustomParameter } from '../custom-parameter.do';

export class ToolParameterValueMissingLoggableException extends BusinessError implements Loggable {
	constructor(private readonly validatableToolId: EntityId | undefined, private readonly parameter: CustomParameter) {
		super(
			{
				type: 'TOOL_PARAMETER_VALUE_MISSING',
				title: 'Missing tool parameter value',
				defaultMessage: 'The parameter has no value.',
			},
			HttpStatus.BAD_REQUEST,
			{
				parameter,
				validatableToolId,
			}
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: this.message,
			type: this.type,
			stack: this.stack,
			data: {
				parameterName: this.parameter.name,
				validatableToolId: this.validatableToolId,
			},
		};
	}
}
