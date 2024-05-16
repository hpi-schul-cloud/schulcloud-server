import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { CustomParameter } from '../../common/domain';
import { ContextExternalToolLaunchable } from '../../context-external-tool/domain';

export class MissingToolParameterValueLoggableException extends BusinessError implements Loggable {
	constructor(
		private readonly contextExternalTool: ContextExternalToolLaunchable,
		private readonly parameters: CustomParameter[]
	) {
		super(
			{
				type: 'MISSING_TOOL_PARAMETER_VALUE',
				title: 'Missing tool parameter value',
				defaultMessage: 'The external tool was attempted to launch, but a parameter was not configured.',
			},
			HttpStatus.UNPROCESSABLE_ENTITY,
			{
				parameterKeys: parameters.map((param): string => param.name),
				parameterNames: parameters.map((param): string => param.displayName),
			}
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const parameterNames: string[] = this.parameters.map((param): string => param.name);

		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				contextExternalToolId: this.contextExternalTool.id,
				parameterNames: `[${parameterNames.join(', ')}]`,
			},
		};
	}
}
