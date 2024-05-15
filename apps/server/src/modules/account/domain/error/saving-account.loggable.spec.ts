import { SavingAccountLoggable } from './saving-account.loggable';

describe('SavingAccountLoggable', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const accountId = 'test-account-id';
			const loggable = new SavingAccountLoggable(accountId);

			expect(loggable).toEqual({ accountId: 'test-account-id' });
			expect(loggable.getLogMessage()).toStrictEqual({
				data: { accountId: 'test-account-id' },
				message: 'Saving account ...',
			});
		});
	});
});
