import { DomainModel, EntityId } from '@shared/domain/types';
import { DeletionTargetRef } from '../interface';

export class DeletionTargetRefBuilder {
	static build(domain: DomainModel, id: EntityId): DeletionTargetRef {
		const deletionTargetRef = { domain, id };

		return deletionTargetRef;
	}
}
