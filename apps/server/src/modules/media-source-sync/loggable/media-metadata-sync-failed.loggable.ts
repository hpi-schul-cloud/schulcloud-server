import { ErrorUtils } from '@core/error/utils';
import { Loggable, LogMessage } from '@core/logger';
import { MediaSourceDataFormat } from '@modules/media-source';

export class MediaMetadataSyncFailedLoggable implements Loggable {
	constructor(
		private readonly mediumId: string,
		private readonly mediaSourceFormat: MediaSourceDataFormat,
		private readonly error: unknown
	) {}

	public getLogMessage(): LogMessage {
		let errorMessage = 'An unknown type of error had been thrown.';
		let errorType = 'MEDIA_METADATA_SYNC_UNEXPECTED_ERROR';

		if (ErrorUtils.isBusinessError(this.error)) {
			errorMessage = `${this.error.title} ${this.error.message}`;
			errorType = this.error.type;
		} else if (this.error instanceof Error) {
			errorMessage = this.error.message;
		}

		const logMessage: LogMessage = {
			message: `Metadata sync for ${this.mediaSourceFormat} medium ${this.mediumId} failed with the following error message. ${errorMessage}`,
			data: {
				mediaSourceFormat: this.mediaSourceFormat,
				mediumId: this.mediumId,
				type: errorType,
			},
		};

		return logMessage;
	}
}
