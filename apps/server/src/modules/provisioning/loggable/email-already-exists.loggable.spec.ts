import { EmailAlreadyExistsLoggable } from '@modules/provisioning/loggable/email-already-exists.loggable';

describe('EmailAlreadyExistsLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const email = 'mock-email';
			const externalId = '789';

			const loggable = new EmailAlreadyExistsLoggable(email, externalId);

			return {
				loggable,
				email,
				externalId,
			};
		};

		it('should return the correct log message', () => {
			const { loggable, email, externalId } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'The Email to be provisioned already exists.',
				data: {
					email,
					externalId,
				},
			});
		});
	});
});
