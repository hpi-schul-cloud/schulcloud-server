import { Loggable, LogMessage } from '@infra/logger';

interface S3ActionsLoggableParams {
	action: string;
	objectPath?: string | string[];
	bucket: string;
}

export class S3ClientActionLoggable implements Loggable {
	constructor(
		private readonly message: string,
		private readonly payload: S3ActionsLoggableParams
	) {}

	public getLogMessage(): LogMessage {
		return {
			message: this.message,
			data: {
				action: this.payload.action,
				bucket: this.payload.bucket,
				objectPath: JSON.stringify(this.payload.objectPath),
			},
		};
	}
}
