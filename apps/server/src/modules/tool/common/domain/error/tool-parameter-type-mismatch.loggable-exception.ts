import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';
import { type CustomParameter } from '../custom-parameter.do';

export class ToolParameterTypeMismatchLoggableException extends BusinessError implements Loggable {
	constructor(
		private readonly toolId: EntityId | undefined,
		private readonly parameterDeclaration: CustomParameter
	) {
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

	public getLogMessage(): LoggableMessage {
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
