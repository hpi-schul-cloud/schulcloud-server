import { ToolContextType } from '../../common/enum';
import { RestrictedContextMismatchLoggable } from './restricted-context-mismatch-loggabble';

describe('RestrictedContextMismatchLoggable', () => {
	describe('constructor', () => {
		const setup = () => {
			const externalToolName = 'name';
			const context: ToolContextType = ToolContextType.COURSE;

			return { externalToolName, context };
		};

		it('should create an instance of RestrictedContextMismatchLoggable', () => {
			const { externalToolName, context } = setup();

			const loggable = new RestrictedContextMismatchLoggable(externalToolName, context);

			expect(loggable).toBeInstanceOf(RestrictedContextMismatchLoggable);
		});
	});

	describe('getLogMessage', () => {
		const setup = () => {
			const externalToolName = 'name';
			const context: ToolContextType = ToolContextType.COURSE;
			const loggable = new RestrictedContextMismatchLoggable(externalToolName, context);

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
