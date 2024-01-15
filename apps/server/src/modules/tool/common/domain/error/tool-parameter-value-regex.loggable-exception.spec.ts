import { customParameterFactory } from '@shared/testing';
import { CustomParameter } from '../custom-parameter.do';
import { ToolParameterValueRegexLoggableException } from './tool-parameter-value-regex.loggable-exception';

describe(ToolParameterValueRegexLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const parameter: CustomParameter = customParameterFactory.build();

			const exception: ToolParameterValueRegexLoggableException = new ToolParameterValueRegexLoggableException(
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
				type: 'TOOL_PARAMETER_VALUE_REGEX',
				message: 'The parameter value does not fit the regex.',
				stack: exception.stack,
				data: {
					parameterName: parameter.name,
				},
			});
		});
	});
});
