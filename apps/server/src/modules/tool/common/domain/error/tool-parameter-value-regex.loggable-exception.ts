import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { EntityId } from '@shared/domain/types';
import { CustomParameter } from '../custom-parameter.do';

export class ToolParameterValueRegexLoggableException extends BusinessError implements Loggable {
	constructor(
		private readonly toolId: EntityId | undefined,
		private readonly parameterDeclaration: CustomParameter
	) {
		super(
			{
				type: 'TOOL_PARAMETER_VALUE_REGEX',
				title: 'Tool parameter value is no regex',
				defaultMessage: 'The parameter value does not fit the regex.',
			},
			HttpStatus.BAD_REQUEST,
			{
				toolId,
				parameterDeclaration,
			}
		);
	}

	getLogMessage(): LoggableMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				toolId: this.toolId,
				parameterName: this.parameterDeclaration.name,
			},
		};
	}
}
