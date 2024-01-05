import { EntityId } from '@shared/domain/types';
import { DomainModel } from '@shared/domain/types/domain';

export interface DeletionTargetRef {
	targetRefDomain: DomainModel;
	targetRefId: EntityId;
}

export interface DeletionRequestLog {
	targetRef: DeletionTargetRef;
	deletionPlannedAt: Date;
	statistics?: DeletionLogStatistic[];
}

export interface DeletionLogStatistic {
	domain: DomainModel;
	modifiedCount?: number;
	deletedCount?: number;
}

export interface DeletionRequestProps {
	targetRef: { targetRefDoamin: DomainModel; targetRefId: EntityId };
	deleteInMinutes?: number;
}

export interface DeletionRequestCreateAnswer {
	requestId: EntityId;
	deletionPlannedAt: Date;
}
