import { DeletingAccountWithUserIdLoggable } from './deleting-account-with-user-id.loggable';

describe('DeletingAccountWithUserIdLoggable', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const userId = 'test-user-id';
			const loggable = new DeletingAccountWithUserIdLoggable(userId);

			expect(loggable).toEqual({ userId: 'test-user-id' });
			expect(loggable.getLogMessage()).toStrictEqual({
				data: { userId: 'test-user-id' },
				message: 'Deleting account ...',
			});
		});
	});
});
