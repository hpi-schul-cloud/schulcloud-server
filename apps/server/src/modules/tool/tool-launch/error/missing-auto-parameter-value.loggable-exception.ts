import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { ContextExternalToolLaunchable } from '../../context-external-tool/domain';
import { CustomParameterType } from '../../common/enum';

export class MissingAutoParameterValueLoggableException extends BusinessError implements Loggable {
	constructor(
		private readonly contextExternalTool: ContextExternalToolLaunchable,
		private readonly parameterType: CustomParameterType
	) {
		super(
			{
				type: 'MISSING_AUTO_PARAMETER_VALUE',
				title: 'Missing auto parameter value',
				defaultMessage:
					'The external tool was attempted to launch, but the value to fill an auto parameter was not found ' +
					'or could not be retrieved successfully',
			},
			HttpStatus.UNPROCESSABLE_ENTITY,
			{
				parameterType,
			}
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				contextExternalToolId: this.contextExternalTool.id,
				parameterType: this.parameterType,
			},
		};
	}
}
