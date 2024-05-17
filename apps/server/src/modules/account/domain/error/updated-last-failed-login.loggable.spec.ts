import { UpdatedLastFailedLoginLoggable } from './updated-last-failed-login.loggable';

describe('UpdatedLastFailedLoginLoggable', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const accountId = 'test-account-id';
			const loggable = new UpdatedLastFailedLoginLoggable(accountId);

			expect(loggable).toEqual({ accountId: 'test-account-id' });
			expect(loggable.getLogMessage()).toStrictEqual({
				data: { accountId: 'test-account-id' },
				message: 'Updated last tried failed login',
			});
		});
	});
});
