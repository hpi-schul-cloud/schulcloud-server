import { EntityId } from '@shared/domain/types';
import { DeletionDomainModel } from '../../domain/types/deletion-domain-model.enum';

export interface DeletionTargetRef {
	targetRefDomain: DeletionDomainModel;
	targetRefId: EntityId;
}

export interface DeletionRequestLog {
	targetRef: DeletionTargetRef;
	deletionPlannedAt: Date;
	statistics?: DeletionLogStatistic[];
}

export interface DeletionLogStatistic {
	domain: DeletionDomainModel;
	modifiedCount?: number;
	deletedCount?: number;
}

export interface DeletionRequestProps {
	targetRef: { targetRefDoamin: DeletionDomainModel; targetRefId: EntityId };
	deleteInMinutes?: number;
}

export interface DeletionRequestCreateAnswer {
	requestId: EntityId;
	deletionPlannedAt: Date;
}
