import { ObjectId } from '@mikro-orm/mongodb';
import { EndSessionEndpointNotFoundLoggableException } from './end-session-endpoint-not-found.loggable-exception';

describe(EndSessionEndpointNotFoundLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const systemId = new ObjectId().toHexString();
			const exception = new EndSessionEndpointNotFoundLoggableException(systemId);

			return {
				exception,
				systemId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, systemId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'INTERNAL_SERVER_ERROR',
				stack: exception.stack,
				message: `End session endpoint for system ${systemId} could not be found`,
				data: {
					systemId,
				},
			});
		});
	});
});
