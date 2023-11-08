import { EntityId } from '@shared/domain';
import { DeletionDomainModel } from '../../domain/types/deletion-domain-model.enum';
import { DeletionTargetRef } from '../interface';

export class DeletionTargetRefBuilder {
	static build(targetRefDomain: DeletionDomainModel, targetRefId: EntityId): DeletionTargetRef {
		const deletionTargetRef = { targetRefDomain, targetRefId };

		return deletionTargetRef;
	}
}
