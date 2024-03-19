import { EntityId } from '@shared/domain/types';
import { DomainName } from '../types';

export interface DeletionTargetRef {
	domain: DomainName;
	id: EntityId;
}
