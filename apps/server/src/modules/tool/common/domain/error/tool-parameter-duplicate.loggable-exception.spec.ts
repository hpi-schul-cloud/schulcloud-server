import { ToolParameterDuplicateLoggableException } from './tool-parameter-duplicate.loggable-exception';

describe(ToolParameterDuplicateLoggableException.name, () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const exception = new ToolParameterDuplicateLoggableException('parameter1');

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'TOOL_PARAMETER_DUPLICATE',
				message: 'The parameter is defined multiple times.',
				stack: exception.stack,
				data: {
					parameterName: 'parameter1',
				},
			});
		});
	});
});
