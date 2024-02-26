import { UserNotFoundAfterProvisioningLoggableException } from './user-not-found-after-provisioning.loggable-exception';

describe('UserNotFoundAfterProvisioningLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const externalUserId = '123';
			const systemId = '456';
			const officialSchoolNumber = '789';

			const exception = new UserNotFoundAfterProvisioningLoggableException(
				externalUserId,
				systemId,
				officialSchoolNumber
			);

			return {
				exception,
				externalUserId,
				systemId,
				officialSchoolNumber,
			};
		};

		it('should return the correct log message', () => {
			const { exception, externalUserId, systemId, officialSchoolNumber } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'USER_NOT_FOUND_AFTER_PROVISIONING',
				message:
					'Unable to find user after provisioning. The feature for OAuth2 provisioning might be disabled for this school.',
				stack: expect.any(String),
				data: {
					externalUserId,
					systemId,
					officialSchoolNumber,
				},
			});
		});
	});
});
