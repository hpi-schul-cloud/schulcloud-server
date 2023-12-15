import { RedisGeneralErrorLoggable } from './redis-general-error.loggable';

describe('RedisGeneralErrorLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const type = 'SUB';
			const error = new Error('test');
			const loggable = new RedisGeneralErrorLoggable(type, error);

			return { loggable, error };
		};

		it('should return a loggable message', () => {
			const { loggable, error } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Redis SUB error',
				type: 'REDIS_SUB_GENERAL_ERROR',
				error,
			});
		});
	});
});
