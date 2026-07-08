import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';
import { type CustomParameter } from '../custom-parameter.do';

export class ToolParameterRequiredLoggableException extends BusinessError implements Loggable {
	constructor(
		private readonly toolId: EntityId | undefined,
		private readonly param: CustomParameter
	) {
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

	getLogMessage(): LoggableMessage {
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
