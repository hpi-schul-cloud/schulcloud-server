import { LicenseMediaSourceMissingLoggable } from './license-media-source-missing.loggable';

describe(LicenseMediaSourceMissingLoggable.name, () => {
	describe('getLogMessage', () => {
		it('should return a loggable message with the mediumId', () => {
			const mediumId = 'urn:bilo:medium:WEB-507-76690';
			const loggable = new LicenseMediaSourceMissingLoggable(mediumId);

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Could not determine the media source for a Schulconnex license.',
				data: { mediumId },
			});
		});
	});
});
