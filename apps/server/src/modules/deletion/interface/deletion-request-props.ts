import { EntityId } from '@shared/domain/types';
import { DomainName } from '../types';

export interface DeletionRequestProps {
	targetRef: { targetRefDoamin: DomainName; targetRefId: EntityId };
	deleteInMinutes?: number;
}
