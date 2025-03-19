import { LogMessage } from '@core/logger';
import { MediaSourceDataFormat } from '@modules/media-source';
import { MediumMetadataStrategyNotImplementedLoggableException } from './medium-metadata-strategy-not-implemented-loggable.exception';

describe(MediumMetadataStrategyNotImplementedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediaSourceDataFormat = MediaSourceDataFormat.BILDUNGSLOGIN;
			const exception = new MediumMetadataStrategyNotImplementedLoggableException(mediaSourceDataFormat);

			return {
				exception,
				mediaSourceDataFormat,
			};
		};

		it('should return the correct log message', () => {
			const { exception, mediaSourceDataFormat } = setup();

			const logMessage = exception.getLogMessage();
			expect(logMessage).toEqual<LogMessage>({
				message: `The sync strategy for media source data format ${mediaSourceDataFormat} is not implemented or not registered.`,
				data: {
					mediaSourceDataFormat,
				},
			});
		});
	});
});
