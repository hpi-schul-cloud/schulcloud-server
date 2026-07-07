import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { EntityId } from '@shared/domain/types';
import { CustomParameter } from '../custom-parameter.do';

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
