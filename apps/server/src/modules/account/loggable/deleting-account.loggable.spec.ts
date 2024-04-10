import { DeletingAccountLoggable } from './deleting-account.loggable';

describe('DeletingAccountLoggable', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const accountId = 'test-account-id';
			const loggable = new DeletingAccountLoggable(accountId);

			expect(loggable).toEqual({ accountId: 'test-account-id' });
			expect(loggable.getLogMessage()).toStrictEqual({
				data: { accountId: 'test-account-id' },
				message: 'Deleting account ...',
			});
		});
	});
});
