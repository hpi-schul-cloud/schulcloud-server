import { EntityId } from '@shared/domain';
import { DeletionDomainModel } from '../../domain/types/deletion-domain-model.enum';

export interface DeletionTargetRef {
	targetRefDomain: DeletionDomainModel;
	targetRefId: EntityId;
}

export interface DeletionLogStatistic {
	domain: DeletionDomainModel;
	modifiedCount?: number;
	deletedCount?: number;
}
