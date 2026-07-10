import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';
import { type CustomParameter } from '../custom-parameter.do';

export class ToolParameterMandatoryValueMissingLoggableException extends BusinessError implements Loggable {
	constructor(
		private readonly validatableToolId: EntityId | undefined,
		private readonly parameter: CustomParameter
	) {
		super(
			{
				type: 'TOOL_PARAMETER_MANDATORY_VALUE_MISSING',
				title: 'Missing mandatory tool parameter value',
				defaultMessage: 'The mandatory parameter has no value.',
			},
			HttpStatus.BAD_REQUEST,
			{
				parameter,
				validatableToolId,
			}
		);
	}

	public getLogMessage(): LoggableMessage {
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
