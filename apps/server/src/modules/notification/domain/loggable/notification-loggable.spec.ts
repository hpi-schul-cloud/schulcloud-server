import { NotificationLoggable } from './notification-loggable';

describe(NotificationLoggable.name, () => {
	describe('getLogMessage', () => {
		describe('when a userId is provided', () => {
			const setup = () => {
				const data = { userId: 'user-123' };
				const loggable = new NotificationLoggable(data);

				return { data, loggable };
			};

			it('should return a log message containing type and user-specific message', () => {
				const { data, loggable } = setup();

				const result = loggable.getLogMessage();

				expect(result).toEqual({
					type: 'IMPORT_MESSAGE_NOTIFICATION',
					message: 'New notification for user user-123',
					data,
				});
			});
		});

		describe('when a userId is NOT provided', () => {
			const setup = () => {
				const data = { type: 'error' };
				const loggable = new NotificationLoggable(data);

				return { data, loggable };
			};

			it('should return a log message containing type and default message', () => {
				const { data, loggable } = setup();

				const result = loggable.getLogMessage();

				expect(result).toEqual({
					type: 'IMPORT_MESSAGE_NOTIFICATION',
					message: 'A notification entry was created.',
					data,
				});
			});
		});
	});
});
