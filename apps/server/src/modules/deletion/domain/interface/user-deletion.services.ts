import { EntityId } from '@shared/domain/types';
import { DomainDeletionReport } from './domain-deletion-report';
import { DomainName } from '../types';

export interface UserDeletionService {
	invokeUserDeletion(id: EntityId): Promise<DomainDeletionReport | DomainDeletionReport[]>;
	getDomainName(): DomainName;
	compensateUserDeletion?(id: EntityId): void;
}
