import { UserAlreadyMigratedLoggable } from './user-already-migrated.loggable';

describe('UserAlreadyMigratedLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = 'userId';
			const loggable = new UserAlreadyMigratedLoggable(userId);

			return {
				loggable,
				userId,
			};
		};

		it('should return the correct log message', () => {
			const { loggable, userId } = setup();

			expect(loggable.getLogMessage()).toEqual({
				message: 'The user has migrated already and will be skipped during migration process.',
				data: {
					userId,
				},
			});
		});
	});
});
