import { UpdatedAccountUsernameLoggable } from './updated-account-username.loggable';

describe('UpdatedAccountPasswordLoggable', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const accountId = 'test-account-id';
			const loggable = new UpdatedAccountUsernameLoggable(accountId);

			expect(loggable).toEqual({ accountId: 'test-account-id' });
			expect(loggable.getLogMessage()).toStrictEqual({
				data: { accountId: 'test-account-id' },
				message: 'Updated username',
			});
		});
	});
});
