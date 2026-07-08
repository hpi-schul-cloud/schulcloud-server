import { type EntityId } from '@shared/domain/types';
import { type DeletionTargetRef } from '../../../../domain/interface';
import { type DomainName } from '../../../../domain/types';

export class DeletionTargetRefBuilder {
	public static build(domain: DomainName, id: EntityId): DeletionTargetRef {
		const deletionTargetRef = { domain, id };

		return deletionTargetRef;
	}
}
