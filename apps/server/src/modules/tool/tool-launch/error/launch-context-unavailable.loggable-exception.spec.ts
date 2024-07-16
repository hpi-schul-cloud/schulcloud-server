import { ObjectId } from '@mikro-orm/mongodb';
import { ToolContextType } from '../../common/enum';
import { ContextExternalToolLaunchable } from '../../context-external-tool/domain';
import { LaunchContextUnavailableLoggableException } from './launch-context-unavailable.loggable-exception';

describe(LaunchContextUnavailableLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const contextExternalTool: ContextExternalToolLaunchable = {
				schoolToolRef: {
					schoolToolId: new ObjectId().toHexString(),
				},
				contextRef: {
					type: ToolContextType.COURSE,
					id: new ObjectId().toHexString(),
				},
				parameters: [],
			};

			const exception = new LaunchContextUnavailableLoggableException(contextExternalTool, userId);

			return {
				contextExternalTool,
				userId,
				exception,
			};
		};

		it('should log the correct message', () => {
			const { contextExternalTool, userId, exception } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'LAUNCH_CONTEXT_UNAVAILABLE',
				message: 'The context type cannot launch school external tools',
				stack: expect.any(String),
				data: {
					userId,
					schoolExternalToolId: contextExternalTool.schoolToolRef.schoolToolId,
					contextType: contextExternalTool.contextRef.type,
					contextId: contextExternalTool.contextRef.id,
				},
			});
		});
	});
});
