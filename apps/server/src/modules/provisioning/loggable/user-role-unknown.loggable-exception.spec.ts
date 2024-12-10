import { externalUserDtoFactory } from '../testing';
import { UserRoleUnknownLoggableException } from './user-role-unknown.loggable-exception';

describe(UserRoleUnknownLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const externalUser = externalUserDtoFactory.build();

			const loggable = new UserRoleUnknownLoggableException(externalUser);

			return {
				loggable,
				externalUser,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, externalUser } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'EXTERNAL_USER_ROLE_UNKNOWN',
				stack: expect.any(String),
				message: 'External user has no or no known role assigned to them',
				data: {
					externalUserId: externalUser.externalId,
				},
			});
		});
	});
});
