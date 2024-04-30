import { toolConfigurationStatusFactory } from '@shared/testing';
import { ToolStatusOutdatedLoggableException } from './tool-status-outdated.loggable-exception';

describe('ToolStatusOutdatedLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const toolId = 'toolId';
			const userId = 'userId';
			const toolConfigStatus = toolConfigurationStatusFactory.build();

			const exception = new ToolStatusOutdatedLoggableException(
				userId,
				toolId,
				toolConfigStatus.isOutdatedOnScopeSchool,
				toolConfigStatus.isOutdatedOnScopeContext,
				toolConfigStatus.isIncompleteOnScopeContext,
				toolConfigStatus.isIncompleteOperationalOnScopeContext,
				toolConfigStatus.isDeactivated
			);

			return {
				exception,
			};
		};

		it('should log the correct message', () => {
			const { exception } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'TOOL_STATUS_OUTDATED',
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
				},
			});
		});
	});
});
