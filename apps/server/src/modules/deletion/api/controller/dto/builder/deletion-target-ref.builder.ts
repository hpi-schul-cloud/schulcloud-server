import { EntityId } from '@shared/domain/types';
import { DeletionTargetRef } from '../../../../domain/interface';
import { DomainName } from '../../../../domain/types';

export class DeletionTargetRefBuilder {
	static build(domain: DomainName, id: EntityId): DeletionTargetRef {
		const deletionTargetRef = { domain, id };

		return deletionTargetRef;
	}
}
