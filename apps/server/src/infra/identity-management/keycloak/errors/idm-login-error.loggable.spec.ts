import { IDMLoginError } from './idm-login-error.loggable';

describe('IDMLoginError', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const err = new Error();
			const loggable = new IDMLoginError(err);

			expect(loggable.getLogMessage()).toStrictEqual({
				message: 'Error while trying to login via IDM',
				stack: err.stack,
				type: 'IDM_LOGIN_ERROR',
			});
		});
	});
});
