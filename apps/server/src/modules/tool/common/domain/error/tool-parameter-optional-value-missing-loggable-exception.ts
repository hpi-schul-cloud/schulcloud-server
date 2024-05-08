import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { EntityId } from '@shared/domain/types';
import { CustomParameter } from '../custom-parameter.do';

export class ToolParameterOptionalValueMissingLoggableException extends BusinessError implements Loggable {
	constructor(private readonly validatableToolId: EntityId | undefined, private readonly parameter: CustomParameter) {
		super(
			{
				type: 'VALUE_MISSING_ON_OPTIONAL_TOOL_PARAMETER',
				title: 'Missing value on optional tool parameter',
				defaultMessage: 'The optional parameter has no value.',
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
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				parameterName: this.parameter.name,
				validatableToolId: this.validatableToolId,
			},
		};
	}
}
