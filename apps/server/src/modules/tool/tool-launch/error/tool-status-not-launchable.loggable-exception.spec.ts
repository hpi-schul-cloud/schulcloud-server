import { contextExternalToolFactory } from '../../context-external-tool/testing';
import { toolConfigurationStatusFactory } from '../../external-tool/testing';
import { ToolStatusNotLaunchableLoggableException } from './tool-status-not-launchable.loggable-exception';

describe(ToolStatusNotLaunchableLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = 'userId';
			const contextExternalTool = contextExternalToolFactory.build();
			const toolConfigStatus = toolConfigurationStatusFactory.build();

			const exception = new ToolStatusNotLaunchableLoggableException(userId, contextExternalTool, toolConfigStatus);

			return {
				exception,
				toolConfigStatus,
				contextExternalTool,
			};
		};

		it('should log the correct message', () => {
			const { exception, toolConfigStatus, contextExternalTool } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'TOOL_STATUS_NOT_LAUNCHABLE',
				message: expect.any(String),
				stack: expect.any(String),
				data: {
					userId: 'userId',
					contextExternalToolId: contextExternalTool.id,
					schoolExternalToolId: contextExternalTool.schoolToolRef.schoolToolId,
					status: toolConfigStatus,
				},
			});
		});
	});
});
