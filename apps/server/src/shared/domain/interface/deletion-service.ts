import { DomainDeletionReport } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';

export interface DeletionService {
	deleteUserData(id: EntityId): Promise<DomainDeletionReport | DomainDeletionReport[]>;
}
