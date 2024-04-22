import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { HttpStatus } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CustomParameter } from '../custom-parameter.do';

export class ToolParameterTypeMismatchLoggableException extends BusinessError implements Loggable {
	constructor(private readonly toolId: EntityId | undefined, private readonly parameterDeclaration: CustomParameter) {
		super(
			{
				type: 'TOOL_PARAMETER_TYPE_MISMATCH',
				title: 'Parameter type mismatch',
				defaultMessage: 'The parameter value has the wrong type.',
			},
			HttpStatus.BAD_REQUEST,
			{
				toolId,
				parameterDeclaration,
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
				parameterName: this.parameterDeclaration.name,
				parameterType: this.parameterDeclaration.type,
			},
		};
	}
}
