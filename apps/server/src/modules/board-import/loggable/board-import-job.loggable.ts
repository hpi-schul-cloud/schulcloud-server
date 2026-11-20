import { type Loggable, type LogMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';
import { type BoardImportSource } from '../domain';

export enum BoardImportStep {
	CREATE_JOB = 'create-job',
	PUBLISH_JOB = 'publish-job',
	PROCESS_JOB = 'process-job',
}

export enum BoardImportStepResult {
	SUCCESS = 'success',
	FAILURE = 'failure',
}

export interface BoardImportJobLogInfo {
	jobId: EntityId;
	source?: BoardImportSource;
	step: BoardImportStep;
	result: BoardImportStepResult;
}

// Carries only fixed fields. It must never carry board contents, links or tokens.
export class BoardImportJobLoggable implements Loggable {
	constructor(private readonly info: BoardImportJobLogInfo) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: 'Board import job step',
			data: {
				jobId: this.info.jobId,
				source: this.info.source,
				step: this.info.step,
				result: this.info.result,
			},
		};

		return message;
	}
}
