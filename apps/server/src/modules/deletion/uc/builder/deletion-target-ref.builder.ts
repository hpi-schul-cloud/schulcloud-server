import { EntityId } from '@shared/domain/types';
import { DeletionDomainModel } from '../../domain/types/deletion-domain-model.enum';
import { DeletionTargetRef } from '../interface/interfaces';

export class DeletionTargetRefBuilder {
	static build(targetRefDomain: DeletionDomainModel, targetRefId: EntityId): DeletionTargetRef {
		const deletionTargetRef = { targetRefDomain, targetRefId };

		return deletionTargetRef;
	}
}
