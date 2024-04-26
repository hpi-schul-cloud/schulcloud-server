import { ToolParameterDuplicateLoggableException } from './tool-parameter-duplicate.loggable-exception';

describe(ToolParameterDuplicateLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception: ToolParameterDuplicateLoggableException = new ToolParameterDuplicateLoggableException(
				'toolId',
				'parameter1'
			);

			return {
				exception,
			};
		};

		it('should return log message', () => {
			const { exception } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'TOOL_PARAMETER_DUPLICATE',
				message: 'The parameter is defined multiple times.',
				stack: exception.stack,
				data: {
					toolId: 'toolId',
					parameterName: 'parameter1',
				},
			});
		});
	});
});
