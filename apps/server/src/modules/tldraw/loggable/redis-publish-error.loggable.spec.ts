import { RedisPublishErrorLoggable } from './redis-publish-error.loggable';

describe('RedisPublishErrorLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const type = 'document';
			const error = new Error('test');
			const loggable = new RedisPublishErrorLoggable(type, error);

			return { loggable, error };
		};

		it('should return a loggable message', () => {
			const { loggable, error } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Error while publishing document state to Redis',
				type: 'REDIS_PUBLISH_ERROR',
				error,
			});
		});
	});
});
