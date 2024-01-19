import { ValidationError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { CustomParameter } from '../custom-parameter.do';

export class ToolParameterTypeMismatchLoggableException extends ValidationError implements Loggable {
	constructor(private readonly parameterDeclaration: CustomParameter) {
		super(
			`tool_param_type_mismatch: The value of parameter with name ${parameterDeclaration.name} should be of type ${parameterDeclaration.type}.`
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'TOOL_PARAMETER_TYPE_MISMATCH',
			message: 'The parameter value has the wrong type.',
			stack: this.stack,
			data: {
				parameterName: this.parameterDeclaration.name,
				parameterType: this.parameterDeclaration.type,
			},
		};
	}
}
