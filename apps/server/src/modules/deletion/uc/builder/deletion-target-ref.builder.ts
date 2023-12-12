import { EntityId } from '@shared/domain/types';
import { DeletionDomainModel } from '../../domain/types';
import { DeletionTargetRef } from '../../interface';

export class DeletionTargetRefBuilder {
	static build(targetRefDomain: DeletionDomainModel, targetRefId: EntityId): DeletionTargetRef {
		const deletionTargetRef = { domain: targetRefDomain, id: targetRefId };

		return deletionTargetRef;
	}
}
