import { Action, AuthorizationBodyParamsReferenceType } from '../authorization-api-client';
import { AuthorizationErrorLoggableException } from './authorization-error.loggable-exception';

describe('AuthorizationErrorLoggableException', () => {
	describe('when error is instance of Error', () => {
		describe('getLogMessage', () => {
			const setup = () => {
				const params = {
					context: {
						action: Action.READ,
						requiredPermissions: [],
					},
					referenceType: AuthorizationBodyParamsReferenceType.COURSES,
					referenceId: 'someReferenceId',
				};

				const error = new Error('testError');
				const exception = new AuthorizationErrorLoggableException(error, params);

				return {
					params,
					error,
					exception,
				};
			};

			it('should log the correct message', () => {
				const { params, error, exception } = setup();

				const result = exception.getLogMessage();

				expect(result).toEqual({
					type: 'INTERNAL_SERVER_ERROR',
					error,
					stack: expect.any(String),
					data: {
						action: params.context.action,
						referenceId: params.referenceId,
						referenceType: params.referenceType,
						requiredPermissions: params.context.requiredPermissions.join(','),
					},
				});
			});
		});
	});

	describe('when error is NOT instance of Error', () => {
		describe('getLogMessage', () => {
			const setup = () => {
				const params = {
					context: {
						action: Action.READ,
						requiredPermissions: [],
					},
					referenceType: AuthorizationBodyParamsReferenceType.COURSES,
					referenceId: 'someReferenceId',
				};

				const error = { code: '123', message: 'testError' };
				const exception = new AuthorizationErrorLoggableException(error, params);

				return {
					params,
					error,
					exception,
				};
			};

			it('should log the correct message', () => {
				const { params, error, exception } = setup();

				const result = exception.getLogMessage();

				expect(result).toEqual({
					type: 'INTERNAL_SERVER_ERROR',
					error: new Error(JSON.stringify(error)),
					stack: expect.any(String),
					data: {
						action: params.context.action,
						referenceId: params.referenceId,
						referenceType: params.referenceType,
						requiredPermissions: params.context.requiredPermissions.join(','),
					},
				});
			});
		});
	});
});
