import { Action, AuthorizationBodyParamsReferenceType } from '../authorization-api-client';
import { AuthorizationErrorLoggableException } from './authorization-error.loggable-exception';

describe('AuthorizationErrorLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const error = new Error('testError');

			const params = {
				context: {
					action: Action.READ,
					requiredPermissions: [],
				},
				referenceType: AuthorizationBodyParamsReferenceType.COURSES,
				referenceId: 'someReferenceId',
			};

			const exception = new AuthorizationErrorLoggableException(error, params);

			return {
				error,
				exception,
				params,
			};
		};

		it('should log the correct message', () => {
			const { error, exception, params } = setup();

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
