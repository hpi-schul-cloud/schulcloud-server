import { EmailAlreadyExistsLoggable } from '@modules/provisioning/loggable/email-already-exists.loggable';

describe('EmailAlreadyExistsLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const email = 'mock-email';
			const systemId = '123';
			const schoolId = '456';
			const externalId = '789';

			const exception = new EmailAlreadyExistsLoggable(email, systemId, schoolId, externalId);

			return {
				exception,
				email,
				systemId,
				schoolId,
				externalId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, email, systemId, schoolId, externalId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'EMAIL_ALREADY_EXISTS',
				message: 'The Email to be provisioned already exists.',
				stack: expect.any(String),
				data: {
					email,
					systemId,
					schoolId,
					externalId,
				},
			});
		});
	});
});
