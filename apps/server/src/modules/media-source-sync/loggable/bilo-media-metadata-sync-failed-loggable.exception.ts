import { ErrorUtils } from '@core/error/utils';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { MediaSourceDataFormat } from '@modules/media-source/enum';

export class BiloMediaMetadataSyncFailedLoggable implements Loggable {
	constructor(
		private readonly mediumId: string,
		private readonly mediaSourceId: string,
		private readonly error: unknown
	) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		let errorMessage = 'Unexpected error.';
		let errorType = 'MEDIA_METADATA_SYNC_UNEXPECTED_ERROR';
		const mediaSourceDataFormat = MediaSourceDataFormat.BILDUNGSLOGIN;

		if (this.error instanceof Error) {
			errorMessage = this.error.message;
		}

		if (ErrorUtils.isBusinessError(this.error)) {
			errorMessage = `${this.error.title} ${this.error.message}`;
			errorType = this.error.type;
		}

		const logMessage: LogMessage = {
			message: `Metadata sync for ${mediaSourceDataFormat} medium ${this.mediumId} and media source ${this.mediaSourceId} failed with the following error message: ${errorMessage}`,
			data: {
				mediumId: this.mediumId,
				mediaSourceId: this.mediaSourceId,
				mediaSourceFormat: mediaSourceDataFormat,
				type: errorType,
			},
		};

		return logMessage;
	}
}
