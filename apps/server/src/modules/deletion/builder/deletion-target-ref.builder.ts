import { EntityId } from '@shared/domain/types';
import { DeletionDomainModel } from '../domain/types';
import { DeletionTargetRef } from '../interface';

export class DeletionTargetRefBuilder {
	static build(domain: DeletionDomainModel, id: EntityId): DeletionTargetRef {
		const deletionTargetRef = { domain, id };

		return deletionTargetRef;
	}
}
