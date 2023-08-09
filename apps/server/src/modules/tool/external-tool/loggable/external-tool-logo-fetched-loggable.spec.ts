import { ExternalToolLogoFetchedLoggable } from './external-tool-logo-fetched-loggable';

describe('ExternalToolLogoFetchedLoggable', () => {
	describe('constructor', () => {
		const setup = () => {
			const logoUrl = 'logoUrl';

			return { logoUrl };
		};

		it('should create an instance of ExternalToolLogoFetchedLoggable', () => {
			const { logoUrl } = setup();

			const loggable = new ExternalToolLogoFetchedLoggable(logoUrl);

			expect(loggable).toBeInstanceOf(ExternalToolLogoFetchedLoggable);
		});
	});

	describe('getLogMessage', () => {
		const setup = () => {
			const logoUrl = 'logoUrl';
			const loggable = new ExternalToolLogoFetchedLoggable(logoUrl);

			return { loggable, logoUrl };
		};

		it('should return a loggable message', () => {
			const { loggable, logoUrl } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'EXTERNAL_TOOL_LOGO_FETCHED',
				message: 'External tool logo was fetched',
				data: {
					logoUrl,
				},
			});
		});
	});
});
