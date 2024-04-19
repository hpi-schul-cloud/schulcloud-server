import { ToolContextType } from '../../../common/enum';
import { RestrictedContextMismatchLoggableException } from './restricted-context-mismatch-loggabble';

describe('RestrictedContextMismatchLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const externalToolName = 'name';
			const context: ToolContextType = ToolContextType.COURSE;
			const loggable = new RestrictedContextMismatchLoggableException(externalToolName, context);

			return { loggable, externalToolName, context };
		};

		it('should return a loggable message', () => {
			const { loggable, externalToolName, context } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'UNPROCESSABLE_ENTITY_EXCEPTION',
				message: `Could not create an instance of ${externalToolName} in context: ${context} because of the context restrictions of the tool.`,
				stack: loggable.stack,
				data: {
					externalToolName,
					context,
				},
			});
		});
	});
});
