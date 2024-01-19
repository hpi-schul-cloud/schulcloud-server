import { customParameterFactory } from '@shared/testing';
import { CustomParameter } from '../custom-parameter.do';
import { ToolParameterValueMissingLoggableException } from './tool-parameter-value-missing.loggable-exception';

describe(ToolParameterValueMissingLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const parameter: CustomParameter = customParameterFactory.build();

			const exception: ToolParameterValueMissingLoggableException = new ToolParameterValueMissingLoggableException(
				parameter
			);

			return {
				parameter,
				exception,
			};
		};

		it('should return log message', () => {
			const { exception, parameter } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'TOOL_PARAMETER_VALUE_MISSING',
				message: 'The parameter has no value.',
				stack: exception.stack,
				data: {
					parameterName: parameter.name,
				},
			});
		});
	});
});
