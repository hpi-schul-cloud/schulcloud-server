import { DomainName, EntityId } from '@shared/domain/types';
import { DeletionTargetRef } from '../interface';

export class DeletionTargetRefBuilder {
	static build(domain: DomainName, id: EntityId): DeletionTargetRef {
		const deletionTargetRef = { domain, id };

		return deletionTargetRef;
	}
}
