import { type EntityId } from '@shared/domain/types';
import { type DomainName } from '../types';

export interface DeletionTargetRef {
	domain: DomainName;
	id: EntityId;
}
