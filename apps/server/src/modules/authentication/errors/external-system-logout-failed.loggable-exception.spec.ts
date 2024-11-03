import { ObjectId } from '@mikro-orm/mongodb';
import { ExternalSystemLogoutFailedLoggableException } from './external-system-logout-failed.loggable-exception';

describe(ExternalSystemLogoutFailedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const systemId = new ObjectId().toHexString();
			const externalSystemResponse = 'testing';
			const exception = new ExternalSystemLogoutFailedLoggableException(userId, systemId, externalSystemResponse);

			return {
				exception,
				userId,
				systemId,
				externalSystemResponse,
			};
		};

		it('should return the correct log message', () => {
			const { exception, userId, systemId, externalSystemResponse } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'INTERNAL_SERVER_ERROR',
				stack: exception.stack,
				data: {
					userId,
					systemId,
					externalSystemResponse,
				},
			});
		});
	});
});
