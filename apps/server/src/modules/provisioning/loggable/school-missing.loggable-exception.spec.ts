import { externalUserDtoFactory } from '../testing';
import { SchoolMissingLoggableException } from './school-missing.loggable-exception';

describe(SchoolMissingLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const externalUser = externalUserDtoFactory.build();

			const loggable = new SchoolMissingLoggableException(externalUser);

			return {
				loggable,
				externalUser,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, externalUser } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'SCHOOL_MISSING',
				stack: expect.any(String),
				message: 'Unable to create new external user without a school',
				data: {
					externalUserId: externalUser.externalId,
				},
			});
		});
	});
});
