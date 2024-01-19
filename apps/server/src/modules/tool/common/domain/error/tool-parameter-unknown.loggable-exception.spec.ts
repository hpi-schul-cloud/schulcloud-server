import { CustomParameterEntry } from '../custom-parameter-entry.do';
import { ToolParameterUnknownLoggableException } from './tool-parameter-unknown.loggable-exception';

describe(ToolParameterUnknownLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const parameter: CustomParameterEntry = new CustomParameterEntry({
				name: 'param1',
				value: 'value1',
			});

			const exception: ToolParameterUnknownLoggableException = new ToolParameterUnknownLoggableException(parameter);

			return {
				parameter,
				exception,
			};
		};

		it('should return log message', () => {
			const { exception, parameter } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'TOOL_PARAMETER_UNKNOWN',
				message: 'The parameter is not part of this tool.',
				stack: exception.stack,
				data: {
					parameterName: parameter.name,
				},
			});
		});
	});
});
