import { PoliciesInfoErrorResponseLoggable } from '@shared/common/loggable/policies-info-error-response-loggable';

describe(PoliciesInfoErrorResponseLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const type = 'media source mock';
			const code = '500';
			const value = 'errorcode value';

			const loggable: PoliciesInfoErrorResponseLoggable = new PoliciesInfoErrorResponseLoggable(type, code, value);

			return {
				loggable,
				type,
				code,
				value,
			};
		};

		it('should return the correct log message', () => {
			const { loggable, type, code, value } = setup();

			expect(loggable.getLogMessage()).toEqual({
				message: 'The /policies-info endpoint returned an error for a media source.',
				data: {
					type,
					code,
					value,
				},
			});
		});
	});
});
