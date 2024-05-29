import { toolConfigurationStatusFactory } from '../../external-tool/testing';
import { ToolStatusNotLaunchableLoggableException } from './tool-status-not-launchable.loggable-exception';

describe('ToolStatusNotLaunchableLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const toolId = 'toolId';
			const userId = 'userId';
			const toolConfigStatus = toolConfigurationStatusFactory.build();

			const exception = new ToolStatusNotLaunchableLoggableException(
				userId,
				toolId,
				toolConfigStatus.isOutdatedOnScopeSchool,
				toolConfigStatus.isOutdatedOnScopeContext,
				toolConfigStatus.isIncompleteOnScopeContext,
				toolConfigStatus.isIncompleteOperationalOnScopeContext,
				toolConfigStatus.isDeactivated,
				toolConfigStatus.isNotLicensed
			);

			return {
				exception,
			};
		};

		it('should log the correct message', () => {
			const { exception } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'TOOL_STATUS_NOT_LAUNCHABLE',
				message: expect.any(String),
				stack: expect.any(String),
				data: {
					userId: 'userId',
					toolId: 'toolId',
					isOutdatedOnScopeSchool: false,
					isOutdatedOnScopeContext: false,
					isIncompleteOnScopeContext: false,
					isIncompleteOperationalOnScopeContext: false,
					isDeactivated: false,
					isNotLicensed: false,
				},
			});
		});
	});
});
