import { EntityId } from '@shared/domain';
import { DeletionDomainModel } from '../../domain/types';

export interface DeletionTargetRef {
	domain: DeletionDomainModel;
	id: EntityId;
}

export interface DeletionLogStatistic {
	domain: DeletionDomainModel;
	modifiedCount?: number;
	deletedCount?: number;
}
