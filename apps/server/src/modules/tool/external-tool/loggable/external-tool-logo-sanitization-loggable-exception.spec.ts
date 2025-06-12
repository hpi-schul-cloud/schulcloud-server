import { ExternalToolLogoSanitizationLoggableException } from './external-tool-logo-sanitization-loggable-exception';

describe('ExternalToolLogoSanitizationLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const sanitizerError = 'message';

			const loggable = new ExternalToolLogoSanitizationLoggableException(sanitizerError);

			return { sanitizerError, loggable };
		};

		it('should return a loggable message', () => {
			const { sanitizerError, loggable } = setup();
			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'IMAGE_SANITIZATION_FAILED',
				message: 'Image sanitization failed.',
				stack: loggable.stack,
				data: {
					sanitizerError,
				},
			});
		});
	});
});
