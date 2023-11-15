import { ExternalToolMetadataLoggable } from './external-tool-metadata-loggable';

describe('ExternalToolMetadataLoggable', () => {
	describe('constructor', () => {
		it('should create an instance of ExternalToolLogoFetchedLoggable', () => {
			const loggable = new ExternalToolMetadataLoggable();

			expect(loggable).toBeInstanceOf(ExternalToolMetadataLoggable);
		});
	});
});
