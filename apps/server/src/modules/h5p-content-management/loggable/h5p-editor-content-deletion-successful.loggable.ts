import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class H5pEditorContentDeletionSuccessfulLoggable implements Loggable {
	constructor(private readonly contentId: string) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Content successfully deleted',
			data: {
				contentId: this.contentId,
			},
		};
	}
}
