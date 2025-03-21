import { LogMessage } from '@core/logger';
import { BiloMediaMetadataSyncFailedLoggable } from './bilo-media-metadata-sync-failed-loggable.exception';

describe(BiloMediaMetadataSyncFailedLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediumId = 'mediumId';
			const mediaSourceId = 'mediaSourceId';
			const exception = new BiloMediaMetadataSyncFailedLoggable(mediumId, mediaSourceId);

			return {
				exception,
				mediumId,
				mediaSourceId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, mediumId, mediaSourceId } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				message: `Metadata Synchronization for mediumId: ${mediumId} and mediaSourceId: ${mediaSourceId} failed.`,
				data: {
					mediumId,
					mediaSourceId,
				},
			} as LogMessage);
		});
	});
});
