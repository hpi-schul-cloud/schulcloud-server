import { ExternalToolImageSanitizationLoggableException } from './external-tool-image-sanitization-loggable-exception';

describe('ExternalToolImageSanitizationLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const loggable = new ExternalToolImageSanitizationLoggableException();

			return { loggable };
		};

		it('should return a loggable message', () => {
			const { loggable } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'IMAGE_SANITIZATION_FAILED',
				message: 'Image sanitization failed.',
				stack: loggable.stack,
			});
		});
	});
});
