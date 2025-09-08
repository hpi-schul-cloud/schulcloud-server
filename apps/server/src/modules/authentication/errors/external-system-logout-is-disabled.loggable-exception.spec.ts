import { ExternalSystemLogoutIsDisabledLoggableException } from './external-system-logout-is-disabled.loggable-exception';

describe(ExternalSystemLogoutIsDisabledLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new ExternalSystemLogoutIsDisabledLoggableException();

			return {
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { exception } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'FORBIDDEN_EXCEPTION',
				message: 'Feature flag for external system logout is not enabled',
				stack: exception.stack,
			});
		});
	});
});
