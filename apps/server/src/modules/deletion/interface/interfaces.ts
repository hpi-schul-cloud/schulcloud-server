import { DomainName, EntityId } from '@shared/domain/types';

export interface DeletionTargetRef {
	domain: DomainName;
	id: EntityId;
}
