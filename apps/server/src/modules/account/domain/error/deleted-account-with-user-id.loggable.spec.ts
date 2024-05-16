import { DeletedAccountWithUserIdLoggable } from './deleted-account-with-user-id.loggable';

describe('DeletedAccountWithUserIdLoggable', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const userId = 'test-user-id';
			const loggable = new DeletedAccountWithUserIdLoggable(userId);

			expect(loggable).toEqual({ userId: 'test-user-id' });
			expect(loggable.getLogMessage()).toStrictEqual({
				data: { userId: 'test-user-id' },
				message: 'Account deleted',
			});
		});
	});
});
