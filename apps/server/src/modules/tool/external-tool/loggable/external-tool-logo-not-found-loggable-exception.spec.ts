import { ExternalToolLogoNotFoundLoggableException } from './external-tool-logo-not-found-loggable-exception';

describe('ExternalToolLogoNotFoundLoggableException', () => {
	describe('constructor', () => {
		const setup = () => {
			const externalToolId = 'externalToolId';

			return { externalToolId };
		};

		it('should create an instance of ExternalToolLogoNotFoundLoggableException', () => {
			const { externalToolId } = setup();

			const loggable = new ExternalToolLogoNotFoundLoggableException(externalToolId);

			expect(loggable).toBeInstanceOf(ExternalToolLogoNotFoundLoggableException);
		});
	});

	describe('getLogMessage', () => {
		const setup = () => {
			const externalToolId = 'externalToolId';
			const loggable = new ExternalToolLogoNotFoundLoggableException(externalToolId);

			return { loggable, externalToolId };
		};

		it('should return a loggable message', () => {
			const { loggable, externalToolId } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'EXTERNAL_TOOL_LOGO_NOT_FOUND',
				message: 'External tool logo not found',
				stack: loggable.stack,
				data: {
					externalToolId,
				},
			});
		});
	});
});
