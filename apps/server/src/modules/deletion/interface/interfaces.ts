import { DomainModel, EntityId } from '@shared/domain/types';

export interface DeletionTargetRef {
	domain: DomainModel;
	id: EntityId;
}
