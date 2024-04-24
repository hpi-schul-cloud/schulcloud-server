import { EmailAlreadyExistsLoggable } from '@modules/provisioning/loggable/email-already-exists.loggable';

describe('EmailAlreadyExistsLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const email = 'mock-email';
			const externalId = '789';

			const exception = new EmailAlreadyExistsLoggable(email, externalId);

			return {
				exception,
				email,
				externalId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, email, externalId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'EMAIL_ALREADY_EXISTS',
				message: 'The Email to be provisioned already exists.',
				stack: expect.any(String),
				data: {
					email,
					externalId,
				},
			});
		});
	});
});
