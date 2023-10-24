import { ExternalToolLogoSizeExceededLoggableException } from './external-tool-logo-size-exceeded-loggable-exception';

describe('ExternalToolLogoSizeExceededLoggableException', () => {
	describe('constructor', () => {
		const setup = () => {
			const externalToolId = 'externalToolId';
			const maxExternalToolLogoSizeInBytes = 100;

			return { externalToolId, maxExternalToolLogoSizeInBytes };
		};

		it('should create an instance of ExternalToolLogoSizeExceededLoggableException', () => {
			const { externalToolId, maxExternalToolLogoSizeInBytes } = setup();

			const loggable = new ExternalToolLogoSizeExceededLoggableException(
				externalToolId,
				maxExternalToolLogoSizeInBytes
			);

			expect(loggable).toBeInstanceOf(ExternalToolLogoSizeExceededLoggableException);
		});
	});

	describe('getLogMessage', () => {
		const setup = () => {
			const externalToolId = 'externalToolId';
			const maxExternalToolLogoSizeInBytes = 100;
			const loggable = new ExternalToolLogoSizeExceededLoggableException(
				externalToolId,
				maxExternalToolLogoSizeInBytes
			);

			return { loggable, externalToolId, maxExternalToolLogoSizeInBytes };
		};

		it('should return a loggable message', () => {
			const { loggable, externalToolId, maxExternalToolLogoSizeInBytes } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'EXTERNAL_TOOL_LOGO_SIZE_EXCEEDED',
				message: 'External tool logo size exceeded',
				stack: loggable.stack,
				data: {
					externalToolId,
					maxExternalToolLogoSizeInBytes,
				},
			});
		});
	});
});
