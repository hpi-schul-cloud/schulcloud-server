import { NotificationLoggable } from './notification-loggable';

describe(NotificationLoggable.name, () => {
	describe('getLogMessage', () => {
		describe('when a userId is provided', () => {
			const setup = () => {
				const userId = 'user-123';
				const loggable = new NotificationLoggable(userId);

				return { userId, loggable };
			};

			it('should return a log message', () => {
				const { userId, loggable } = setup();

				const result = loggable.getLogMessage();

				expect(result).toEqual({
					type: 'USER_NOTIFICATION',
					message: `New notification for user ${userId}`,
					data: { userId },
				});
			});
		});
	});
});
