import { EntityId } from '@shared/domain/types';
import { DomainName } from '@shared/domain/types/domain-name.enum';

export interface DeletionTargetRef {
	targetRefDomain: DomainName;
	targetRefId: EntityId;
}

export interface DeletionRequestLog {
	targetRef: DeletionTargetRef;
	deletionPlannedAt: Date;
	statistics?: DeletionLogStatistic[];
}

export interface DeletionLogStatistic {
	domain: DomainName;
	modifiedCount?: number;
	deletedCount?: number;
}

export interface DeletionRequestProps {
	targetRef: { targetRefDoamin: DomainName; targetRefId: EntityId };
	deleteInMinutes?: number;
}

export interface DeletionRequestCreateAnswer {
	requestId: EntityId;
	deletionPlannedAt: Date;
}
