import { AuthorizationBodyParamsReferenceType, AuthorizationContextParamsAction } from '../authorization-api-client';
import { AuthorizationForbiddenLoggableException } from './authorization-forbidden.loggable-exception';

describe('AuthorizationForbiddenLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const params = {
				context: {
					action: AuthorizationContextParamsAction.READ,
					requiredPermissions: [],
				},
				referenceType: AuthorizationBodyParamsReferenceType.COURSES,
				referenceId: 'someReferenceId',
			};

			const exception = new AuthorizationForbiddenLoggableException(params);

			return {
				exception,
				params,
			};
		};

		it('should log the correct message', () => {
			const { exception, params } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'FORBIDDEN_EXCEPTION',
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
