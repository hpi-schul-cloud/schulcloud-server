import { ExternalToolLogoFetchFailedLoggableException } from './external-tool-logo-fetch-failed-loggable-exception';

describe('ExternalToolLogoFetchFailedLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const logoUrl = 'logoUrl';
			const loggable = new ExternalToolLogoFetchFailedLoggableException(logoUrl, 404);

			return { loggable, logoUrl };
		};

		it('should return a loggable message', () => {
			const { loggable, logoUrl } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'EXTERNAL_TOOL_LOGO_FETCH_FAILED',
				message: 'External tool logo could not been fetched',
				stack: loggable.stack,
				data: {
					logoUrl,
					httpStatus: 404,
				},
			});
		});
	});
});
