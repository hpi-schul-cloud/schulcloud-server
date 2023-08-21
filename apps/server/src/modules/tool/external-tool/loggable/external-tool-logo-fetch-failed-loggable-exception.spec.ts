import { ExternalToolLogoFetchFailedLoggableException } from './external-tool-logo-fetch-failed-loggable-exception';

describe('ExternalToolLogoFetchFailedLoggableException', () => {
	describe('constructor', () => {
		const setup = () => {
			const logoUrl = 'logoUrl';

			return { logoUrl };
		};

		it('should create an instance of ExternalToolLogoNotFoundLoggableException', () => {
			const { logoUrl } = setup();

			const loggable = new ExternalToolLogoFetchFailedLoggableException(logoUrl);

			expect(loggable).toBeInstanceOf(ExternalToolLogoFetchFailedLoggableException);
		});
	});

	describe('getLogMessage', () => {
		const setup = () => {
			const logoUrl = 'logoUrl';
			const loggable = new ExternalToolLogoFetchFailedLoggableException(logoUrl);

			return { loggable, logoUrl };
		};

		it('should return a loggable message', () => {
			const { loggable, logoUrl } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'EXTERNAL_TOOL_LOGO_FETCH_FAILED',
				message: 'External tool logo could not be fetched',
				stack: loggable.stack,
				data: {
					logoUrl,
				},
			});
		});
	});
});
