import { RedisErrorLoggable } from './redis-error.loggable';

describe('RedisGeneralErrorLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const type = 'SUB';
			const error = new Error('test');
			const loggable = new RedisErrorLoggable(type, error);

			return { loggable, error };
		};

		it('should return a loggable message', () => {
			const { loggable, error } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Redis SUB error',
				type: 'REDIS_SUB_ERROR',
				error,
			});
		});
	});
});
