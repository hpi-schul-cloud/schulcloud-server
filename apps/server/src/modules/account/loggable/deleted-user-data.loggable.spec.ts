import { DeletedUserDataLoggable } from './deleted-user-data.loggable';

describe('DeletedUserDataLoggable', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const userId = 'test-user-id';
			const loggable = new DeletedUserDataLoggable(userId);

			expect(loggable).toEqual({ userId: 'test-user-id' });
			expect(loggable.getLogMessage()).toStrictEqual({
				data: { userId: 'test-user-id' },
				message: 'User data deleted from account collection',
			});
		});
	});
});
