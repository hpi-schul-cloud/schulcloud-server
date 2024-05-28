import { UserAlreadyExistLoggable } from './user-migration-already-exist.loggable';

describe('UserAlreadyExistLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = 'userId';
			const loggable = new UserAlreadyExistLoggable(userId);

			return {
				loggable,
				userId,
			};
		};

		it('should return the correct log message', () => {
			const { loggable, userId } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'The user has migrated already and will be skipped during migration process.',
				data: {
					userId,
				},
			});
		});
	});
});
