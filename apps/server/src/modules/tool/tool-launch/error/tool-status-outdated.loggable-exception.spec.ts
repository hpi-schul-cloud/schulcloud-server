import { ToolStatusOutdatedLoggableException } from './tool-status-outdated.loggable-exception';

describe('ToolStatusOutdatedLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const toolId = 'toolId';
			const userId = 'userId';

			const exception = new ToolStatusOutdatedLoggableException(userId, toolId);

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
				},
			});
		});
	});
});
