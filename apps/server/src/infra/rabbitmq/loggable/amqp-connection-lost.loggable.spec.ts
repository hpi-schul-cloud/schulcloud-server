import { AmqpConnectionLostLoggable } from './amqp-connection-lost.loggable';

describe('AmqpConnectionLostLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const error = new Error('Connection closed unexpectedly');
			const loggable = new AmqpConnectionLostLoggable(error);

			return { error, loggable };
		};

		it('should return the error', () => {
			const { error, loggable } = setup();

			const result = loggable.getLogMessage();

			expect(result.error).toBe(error);
		});

		it('should return the correct type', () => {
			const { loggable } = setup();

			const result = loggable.getLogMessage();

			expect(result.type).toBe('AMQP Connection Lost');
		});

		it('should return data with shutdown message', () => {
			const { loggable } = setup();

			const result = loggable.getLogMessage();

			expect(result.data).toEqual({
				message: 'AMQP connection was lost. The application will shut down.',
			});
		});
	});
});
