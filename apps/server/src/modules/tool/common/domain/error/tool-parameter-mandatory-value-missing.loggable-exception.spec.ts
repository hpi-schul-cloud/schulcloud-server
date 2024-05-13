import { customParameterFactory } from '@shared/testing';
import { CustomParameter } from '../custom-parameter.do';
import { ToolParameterMandatoryValueMissingLoggableException } from './tool-parameter-mandatory-value-missing-loggable.exception';

describe(ToolParameterMandatoryValueMissingLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const parameter: CustomParameter = customParameterFactory.build();

			const exception: ToolParameterMandatoryValueMissingLoggableException =
				new ToolParameterMandatoryValueMissingLoggableException('toolId', parameter);

			return {
				parameter,
				exception,
			};
		};

		it('should return log message', () => {
			const { exception, parameter } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'TOOL_PARAMETER_MANDATORY_VALUE_MISSING',
				message: 'The mandatory parameter has no value.',
				stack: exception.stack,
				data: {
					parameterName: parameter.name,
					validatableToolId: 'toolId',
				},
			});
		});
	});
});
