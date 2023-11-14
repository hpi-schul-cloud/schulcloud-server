import { ExternalToolMetadataLoggable } from './external-tool-metadata-loggable';

describe('ExternalToolMetadataLoggable', () => {
	describe('constructor', () => {
		const setup = () => {
			const msg = 'message';

			return { msg };
		};

		it('should create an instance of ExternalToolLogoFetchedLoggable', () => {
			const { msg } = setup();

			const loggable = new ExternalToolMetadataLoggable(msg);

			expect(loggable).toBeInstanceOf(ExternalToolMetadataLoggable);
		});
	});

	describe('getLogMessage', () => {
		const setup = () => {
			const msg = 'message';
			const loggable = new ExternalToolMetadataLoggable(msg);

			return { loggable, msg };
		};

		it('should return a loggable message', () => {
			const { loggable, msg } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'EXTERNAL_TOOL_METADATA',
				message: 'No related tools found, return empty external tool metadata',
				data: {
					msg,
				},
			});
		});
	});
});
