import { IdTokenUserNotFoundLoggableException } from './id-token-user-not-found-loggable-exception';

describe(IdTokenUserNotFoundLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const uuid = 'uuid';
			const additionalInfo = 'additionalInfo';

			const exception = new IdTokenUserNotFoundLoggableException(uuid, additionalInfo);

			return {
				exception,
				uuid,
				additionalInfo,
			};
		};

		it('should return a LogMessage', () => {
			const { exception, uuid, additionalInfo } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				type: 'USER_NOT_FOUND',
				message: 'Failed to find user with uuid from id token.',
				stack: exception.stack,
				data: {
					uuid,
					additionalInfo,
				},
			});
		});
	});
});
