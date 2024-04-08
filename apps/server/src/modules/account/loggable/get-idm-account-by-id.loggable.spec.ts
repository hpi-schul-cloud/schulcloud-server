import { GetOptionalIdmAccountLoggable } from './get-idm-account-by-id.loggable';

describe('GetOptionalIdmAccountLoggable', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const accountId = 'test-account-id';
			const loggable = new GetOptionalIdmAccountLoggable(accountId);

			expect(loggable).toEqual({ accountId: 'test-account-id' });
			expect(loggable.getLogMessage()).toStrictEqual({
				data: { accountId: 'test-account-id' },
				message: 'Account ID could not be resolved. Creating new account and ID ...',
			});
		});
	});
});
