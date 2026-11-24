import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export enum BoardImportJobEvent {
	STARTED = 'started',
	FINISHED = 'finished',
	FAILED = 'failed',
	RETRY = 'retry',
	SKIPPED = 'skipped',
}

export enum BoardImportJobEventReason {
	MAX_ATTEMPTS = 'max-attempts',
	MAX_DURATION = 'max-duration',
	JOB_NOT_FOUND = 'job-not-found',
	JOB_CLOSED = 'job-closed',
}

export class BoardImportJobLoggable implements Loggable {
	constructor(
		private readonly jobId: EntityId,
		private readonly event: BoardImportJobEvent,
		private readonly details: { reason?: BoardImportJobEventReason; attempts?: number } = {}
	) {}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			message: 'Board import job',
			data: {
				jobId: this.jobId,
				event: this.event,
				reason: this.details.reason,
				attempts: this.details.attempts,
			},
		};

		return message;
	}
}
