import { DeletionExecutionTriggerStatus } from './deletion-execution-trigger-status.enum';

export interface DeletionExecutionTriggerResult {
	status: DeletionExecutionTriggerStatus;
	error?: string;
}
