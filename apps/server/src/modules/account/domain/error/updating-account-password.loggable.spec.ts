import { UpdatingAccountPasswordLoggable } from './updating-account-password.loggable';

describe('UpdatingAccountPasswordLoggable', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const accountId = 'test-account-id';
			const loggable = new UpdatingAccountPasswordLoggable(accountId);

			expect(loggable).toEqual({ accountId: 'test-account-id' });
			expect(loggable.getLogMessage()).toStrictEqual({
				data: { accountId: 'test-account-id' },
				message: 'Updating password ...',
			});
		});
	});
});
