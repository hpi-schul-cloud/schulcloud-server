import { ContextExternalToolNameAlreadyExistsLoggableException } from './context-external-tool-name-already-exists.loggable-exception';

describe(ContextExternalToolNameAlreadyExistsLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception: ContextExternalToolNameAlreadyExistsLoggableException =
				new ContextExternalToolNameAlreadyExistsLoggableException('toolname');

			return {
				exception,
			};
		};

		it('should return log message', () => {
			const { exception } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'CONTEXT_EXTERNAL_TOOL_NAME_ALREADY_EXISTS',
				message:
					'A tool with the same name is already assigned to this course. Tool names must be unique within a course.',
				stack: exception.stack,
				data: {
					toolName: 'toolname',
				},
			});
		});
	});
});
