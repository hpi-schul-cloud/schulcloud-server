import { LogMessage } from '@core/logger';
import { MediaSourceDataFormat } from '@modules/media-source/enum';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { BiloMediaMetadataSyncFailedLoggable } from './bilo-media-metadata-sync-failed-loggable.exception';
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

describe(BiloMediaMetadataSyncFailedLoggable.name, () => {
	describe('getLogMessage', () => {
		describe('when the error passed is an BusinessError', () => {
			const setup = () => {
				const mediumId = 'mediumId';
				const mediaSourceId = 'mediaSourceId';
				const mediaSourceFormat = MediaSourceDataFormat.BILDUNGSLOGIN;
				const error = new MockBusinessError();

				return {
					mediumId,
					mediaSourceId,
					mediaSourceFormat,
					error,
				};
			};

			it('should return the a log message based on the BusinessError', () => {
				const { mediumId, mediaSourceFormat, mediaSourceId, error } = setup();
				const loggable = new BiloMediaMetadataSyncFailedLoggable(mediumId, mediaSourceId, error);

				const result = loggable.getLogMessage();

				expect(result).toEqual<LogMessage>({
					message: `Metadata sync for ${mediaSourceFormat} medium ${mediumId} and media source ${mediaSourceId} failed with the following error message: ${error.title} ${error.message}`,
					data: {
						mediaSourceFormat: mediaSourceFormat,
						mediumId: mediumId,
						mediaSourceId: mediaSourceId,
						type: error.type,
					},
				});
			});
		});

		describe('when the error passed is an Error', () => {
			const setup = () => {
				const mediumId = 'mediumId';
				const mediaSourceId = 'mediaSourceId';
				const mediaSourceFormat = MediaSourceDataFormat.BILDUNGSLOGIN;
				const error = new Error('Invalid media metadata');

				return {
					mediumId,
					mediaSourceId,
					mediaSourceFormat,
					error,
				};
			};

			it('should return a log message based on the Error', () => {
				const { mediumId, mediaSourceFormat, mediaSourceId, error } = setup();
				const loggable = new BiloMediaMetadataSyncFailedLoggable(mediumId, mediaSourceId, error);

				const result = loggable.getLogMessage();

				expect(result).toEqual<LogMessage>({
					message: `Metadata sync for ${mediaSourceFormat} medium ${mediumId} and media source ${mediaSourceId} failed with the following error message: ${error.message}`,
					data: {
						mediaSourceFormat: mediaSourceFormat,
						mediaSourceId: mediaSourceId,
						mediumId: mediumId,
						type: 'MEDIA_METADATA_SYNC_UNEXPECTED_ERROR',
					},
				});
			});
		});

		describe('when the error passed is of an unknown type', () => {
			const setup = () => {
				const mediumId = 'mediumId';
				const mediaSourceId = 'mediaSourceId';
				const mediaSourceFormat = MediaSourceDataFormat.BILDUNGSLOGIN;
				const error: unknown = { log: 'Unknown error type', stack: 'test-stack' };

				return {
					mediumId,
					mediaSourceId,
					mediaSourceFormat,
					error,
				};
			};

			it('should return a log message based on the Error', () => {
				const { mediumId, mediaSourceId, mediaSourceFormat, error } = setup();
				const loggable = new BiloMediaMetadataSyncFailedLoggable(mediumId, mediaSourceId, error);

				const result = loggable.getLogMessage();

				expect(result).toEqual<LogMessage>({
					message: `Metadata sync for ${mediaSourceFormat} medium ${mediumId} and media source ${mediaSourceId} failed with the following error message: Unexpected error.`,
					data: {
						mediaSourceFormat: mediaSourceFormat,
						mediumId: mediumId,
						mediaSourceId: mediaSourceId,
						type: 'MEDIA_METADATA_SYNC_UNEXPECTED_ERROR',
					},
				});
			});
		});
	});
});
