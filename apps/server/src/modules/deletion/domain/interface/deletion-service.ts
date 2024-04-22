import { EntityId } from '@shared/domain/types';
import { DomainDeletionReport } from './domain-deletion-report';

export interface DeletionService {
	deleteUserData(id: EntityId, deletionRequestId?: EntityId): Promise<DomainDeletionReport | DomainDeletionReport[]>;
}
