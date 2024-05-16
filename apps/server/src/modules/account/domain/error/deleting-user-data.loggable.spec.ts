import { DeletingUserDataLoggable } from './deleting-user-data.loggable';

describe('DeletingUserDataLoggable', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const userId = 'test-user-id';
			const loggable = new DeletingUserDataLoggable(userId);

			expect(loggable).toEqual({ userId: 'test-user-id' });
			expect(loggable.getLogMessage()).toStrictEqual({
				data: { userId: 'test-user-id' },
				message: 'Start deleting user data in account collection',
			});
		});
	});
});
