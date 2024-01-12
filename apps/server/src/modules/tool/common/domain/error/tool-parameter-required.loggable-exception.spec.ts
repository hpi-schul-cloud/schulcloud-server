import { customParameterFactory } from '@shared/testing';
import { CustomParameter } from '../custom-parameter.do';
import { ToolParameterRequiredLoggableException } from './tool-parameter-required.loggable-exception';

describe(ToolParameterRequiredLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const parameter: CustomParameter = customParameterFactory.build();

			const exception: ToolParameterRequiredLoggableException = new ToolParameterRequiredLoggableException(parameter);

			return {
				parameter,
				exception,
			};
		};

		it('should return log message', () => {
			const { exception, parameter } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'TOOL_PARAMETER_REQUIRED',
				message: 'The parameter is required, but not found in the tool.',
				stack: exception.stack,
				data: {
					parameterName: parameter.name,
				},
			});
		});
	});
});
