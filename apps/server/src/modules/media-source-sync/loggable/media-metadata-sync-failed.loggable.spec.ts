import { LogMessage } from '@core/logger';
import { MediaSourceDataFormat } from '@modules/media-source';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { MediaMetadataSyncFailedLoggable } from './media-metadata-sync-failed.loggable';

class MockBusinessError extends BusinessError {
	constructor() {
		super(
			{
				type: 'MOCK_BUSINESS_ERROR',
				title: 'Mock business error.',
				defaultMessage: 'This is a mock business error.',
			},
			HttpStatus.BAD_REQUEST
		);
	}
}

describe(MediaMetadataSyncFailedLoggable.name, () => {
	describe('getLogMessage', () => {
		describe('when the error passed is a business error', () => {
			const setup = () => {
				const mediumId = 'test-medium-id';
				const mediaSourceFormat = MediaSourceDataFormat.VIDIS;
				const error = new MockBusinessError();

				return {
					mediumId,
					mediaSourceFormat,
					error,
				};
			};

			it('should return the a log message based on the business error', () => {
				const { mediumId, mediaSourceFormat, error } = setup();
				const loggable = new MediaMetadataSyncFailedLoggable(mediumId, mediaSourceFormat, error);

				const result = loggable.getLogMessage();

				expect(result).toEqual<LogMessage>({
					message: `Metadata sync for ${mediaSourceFormat} medium ${mediumId} failed with the following error message. ${error.title} ${error.message}`,
					data: {
						mediaSourceFormat: mediaSourceFormat,
						mediumId: mediumId,
						type: error.type,
					},
				});
			});
		});

		describe('when the error passed is a general error', () => {
			const setup = () => {
				const mediumId = 'test-medium-id';
				const mediaSourceFormat = MediaSourceDataFormat.VIDIS;
				const error = new Error('Invalid media metadata');

				return {
					mediumId,
					mediaSourceFormat,
					error,
				};
			};

			it('should return a log message based on the error', () => {
				const { mediumId, mediaSourceFormat, error } = setup();
				const loggable = new MediaMetadataSyncFailedLoggable(mediumId, mediaSourceFormat, error);

				const result = loggable.getLogMessage();

				expect(result).toEqual<LogMessage>({
					message: `Metadata sync for ${mediaSourceFormat} medium ${mediumId} failed with the following error message. ${error.message}`,
					data: {
						mediaSourceFormat: mediaSourceFormat,
						mediumId: mediumId,
						type: 'MEDIA_METADATA_SYNC_ERROR',
					},
				});
			});
		});

		describe('when the error passed is of an unknown type', () => {
			const setup = () => {
				const mediumId = 'test-medium-id';
				const mediaSourceFormat = MediaSourceDataFormat.VIDIS;
				const error: unknown = { log: 'Unknown error type', stack: 'test-stack' };

				return {
					mediumId,
					mediaSourceFormat,
					error,
				};
			};

			it('should return a log message based on the Error', () => {
				const { mediumId, mediaSourceFormat, error } = setup();
				const loggable = new MediaMetadataSyncFailedLoggable(mediumId, mediaSourceFormat, error);

				const result = loggable.getLogMessage();

				expect(result).toEqual<LogMessage>({
					message: `Metadata sync for ${mediaSourceFormat} medium ${mediumId} failed with the following error message. An unknown type of error had been thrown.`,
					data: {
						mediaSourceFormat: mediaSourceFormat,
						mediumId: mediumId,
						type: 'MEDIA_METADATA_SYNC_UNKNOWN_ERROR',
					},
				});
			});
		});
	});
});
