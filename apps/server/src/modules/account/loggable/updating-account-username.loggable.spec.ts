import { UpdatingAccountUsernameLoggable } from './updating-account-username.loggable';

describe('UpdatingAccountUsernameLoggable', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const accountId = 'test-account-id';
			const loggable = new UpdatingAccountUsernameLoggable(accountId);

			expect(loggable).toEqual({ accountId: 'test-account-id' });
			expect(loggable.getLogMessage()).toStrictEqual({
				data: { accountId: 'test-account-id' },
				message: 'Updating username ...',
			});
		});
	});
});
