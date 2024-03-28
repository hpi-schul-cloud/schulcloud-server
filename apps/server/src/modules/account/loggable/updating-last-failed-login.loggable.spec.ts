import { UpdatingLastFailedLoginLoggable } from './updating-last-failed-login.loggable';

describe('UpdatingLastFailedLoginLoggable', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const accountId = 'test-account-id';
			const loggable = new UpdatingLastFailedLoginLoggable(accountId);

			expect(loggable).toEqual({ accountId: 'test-account-id' });
			expect(loggable.getLogMessage()).toStrictEqual({
				data: { accountId: 'test-account-id' },
				message: 'Updating last tried failed login ...',
			});
		});
	});
});
