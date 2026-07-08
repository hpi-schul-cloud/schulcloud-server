import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type CustomParameter } from '../../common/domain';
import { type ContextExternalToolLaunchable } from '../../context-external-tool/domain';

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

	getLogMessage(): LoggableMessage {
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
