import { ExternalToolLogoWrongFileTypeLoggableException } from './external-tool-logo-wrong-file-type-loggable-exception';

describe('ExternalToolLogoWrongFileTypeLoggableException', () => {
	describe('constructor', () => {
		it('should create an instance of ExternalToolLogoSizeExceededLoggableException', () => {
			const loggable = new ExternalToolLogoWrongFileTypeLoggableException();

			expect(loggable).toBeInstanceOf(ExternalToolLogoWrongFileTypeLoggableException);
		});
	});

	describe('getLogMessage', () => {
		const setup = () => {
			const loggable = new ExternalToolLogoWrongFileTypeLoggableException();

			return { loggable };
		};

		it('should return a loggable message', () => {
			const { loggable } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'EXTERNAL_TOOL_LOGO_WRONG_FILE_TYPE',
				message: 'External tool logo has the wrong file type. Only JPEG and PNG files are supported.',
				stack: loggable.stack,
			});
		});
	});
});
