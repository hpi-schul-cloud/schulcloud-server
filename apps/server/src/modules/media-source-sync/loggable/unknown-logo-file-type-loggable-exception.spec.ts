import { UnknownLogoFileTypeLoggableException } from './unknown-logo-file-type-loggable-exception';

describe(UnknownLogoFileTypeLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const loggable = new UnknownLogoFileTypeLoggableException();

			return { loggable };
		};

		it('should return a loggable message', () => {
			const { loggable } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'UNKNOWN_LOGO_FILE_TYPE',
				message: 'The provided logo has the wrong file type. Only JPEG, PNG and GIF files are supported.',
				stack: loggable.stack,
			});
		});
	});
});
