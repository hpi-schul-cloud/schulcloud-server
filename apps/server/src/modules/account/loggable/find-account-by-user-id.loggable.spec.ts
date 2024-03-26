import { FindAccountByDbcUserIdLoggable } from './find-account-by-user-id.loggable';

describe('FindAccountByDbcUserIdLoggable', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const userId = 'test-user-id';
			const loggable = new FindAccountByDbcUserIdLoggable(userId);

			expect(loggable).toEqual({ userId: 'test-user-id' });
			expect(loggable.getLogMessage()).toStrictEqual({
				data: { userId: 'test-user-id' },
				message: 'Error while searching for account',
			});
		});
	});
});
