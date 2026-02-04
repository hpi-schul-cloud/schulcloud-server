import { NotificationLoggable } from './notification-loggable';

describe(NotificationLoggable.name, () => {
	describe('getLogMessage', () => {
		describe('when a notification message is provided', () => {
			const setup = () => {
				const message = 'Import finished with warnings';
				const loggable = new NotificationLoggable(message);

				return { message, loggable };
			};

			it('should return a log message containing type and message', () => {
				const { message, loggable } = setup();

				const result = loggable.getLogMessage();

				expect(result).toEqual({
					type: 'COMMON_CARTRIDGE_IMPORT_MESSAGE_NOTIFICATION',
					message,
				});
			});
		});
	});
});
