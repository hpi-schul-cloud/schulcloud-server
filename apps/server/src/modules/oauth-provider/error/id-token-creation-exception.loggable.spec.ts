import { IdTokenCreationLoggableException } from './id-token-creation-exception.loggable';

describe('IdTokenCreationExceptionLoggable', () => {
	describe('constructor', () => {
		const setup = () => {
			const clientId = 'clientId';
			const userId = 'userId';

			return { clientId, userId };
		};

		it('should create an instance of IdTokenCreationExceptionLoggable', () => {
			const { clientId, userId } = setup();

			const loggable = new IdTokenCreationLoggableException(clientId, userId);

			expect(loggable).toBeInstanceOf(IdTokenCreationLoggableException);
		});
	});

	describe('getLogMessage', () => {
		const setup = () => {
			const clientId = 'clientId';
			const userId = 'userId';
			const loggable = new IdTokenCreationLoggableException(clientId, userId);

			return { loggable, clientId, userId };
		};

		it('should return a loggable message', () => {
			const { loggable, userId, clientId } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'INTERNAL_SERVER_ERROR_EXCEPTION',
				message: 'Something went wrong for id token creation. Tool could not be found.',
				stack: loggable.stack,
				data: {
					userId,
					clientId,
				},
			});
		});
	});
});
