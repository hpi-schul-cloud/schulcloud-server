import { DeletionLogStatistic } from './deletion-log-statistic';
import { DeletionTargetRef } from './deletion-target-ref';

export interface DeletionRequestLog {
	targetRef: DeletionTargetRef;
	deletionPlannedAt: Date;
	statistics?: DeletionLogStatistic[];
}
