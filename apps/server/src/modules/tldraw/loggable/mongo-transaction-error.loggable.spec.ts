import { MongoTransactionErrorLoggable } from './mongo-transaction-error.loggable';

describe('MongoTransactionErrorLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const error = new Error('test');
			const loggable = new MongoTransactionErrorLoggable(error);

			return { loggable, error };
		};

		it('should return a loggable message', () => {
			const { loggable, error } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Error while saving transaction',
				type: 'MONGO_TRANSACTION_ERROR',
				error,
			});
		});
	});
});
