import { SchulconnexPoliciesInfoErrorResponse } from '@infra/schulconnex-client';
import { schulconnexPoliciesInfoErrorResponseFactory } from '@infra/schulconnex-client/testing';
import { PoliciesInfoErrorResponseLoggable } from './policies-info-error-response-loggable';

describe(PoliciesInfoErrorResponseLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const errorResponse: SchulconnexPoliciesInfoErrorResponse = schulconnexPoliciesInfoErrorResponseFactory.build();

			const loggable: PoliciesInfoErrorResponseLoggable = new PoliciesInfoErrorResponseLoggable(errorResponse);

			return {
				loggable,
				errorResponse,
			};
		};

		it('should return the correct log message', () => {
			const { loggable, errorResponse } = setup();

			expect(loggable.getLogMessage()).toEqual({
				message: 'The /policies-info endpoint returned an error for a media source.',
				data: {
					type: errorResponse.access_control['@type'],
					code: errorResponse.access_control.error.code,
					value: errorResponse.access_control.error.value,
				},
			});
		});
	});
});
