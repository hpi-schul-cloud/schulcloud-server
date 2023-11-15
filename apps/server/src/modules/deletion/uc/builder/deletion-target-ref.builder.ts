import { EntityId } from '@shared/domain';
import { DeletionDomainModel } from '../../domain/types/deletion-domain-model.enum';
import { DeletionTargetRef } from '../interface';

export class DeletionTargetRefBuilder {
	static build(domain: DeletionDomainModel, id: EntityId): DeletionTargetRef {
		const deletionTargetRef = { domain, id };

		return deletionTargetRef;
	}
}
