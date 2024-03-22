import { IdmCallbackLoggableException } from './idm-callback-loggable-exception';

describe('AccountLoggableException', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const error = new Error('error');
			const exception = new IdmCallbackLoggableException(error);

			const result = exception.getLogMessage();

			expect(result).toContain({ accountError: 'Error: error', message: 'error' });
		});
	});
});
// 				  "stack": "Error: error at Object.<anonymous> (D:\\schulcloud\\schulcloud-server\\apps\\server\\src\\modules\\account\\loggable\\account-loggable-exception.spec.ts:6:18));
