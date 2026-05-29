import { DeletionRequest } from '../../domain/do';
import { DeletionRequestEntity } from '../entity';

export class DeletionRequestMapper {
	public static mapToDO(entity: DeletionRequestEntity): DeletionRequest {
		return new DeletionRequest({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			targetRefDomain: entity.targetRefDomain,
			deleteAfter: entity.deleteAfter,
			targetRefId: entity.targetRefId,
			status: entity.status,
			batchId: entity.batchId,
		});
	}

	public static mapToEntity(domainObject: DeletionRequest): DeletionRequestEntity {
		return new DeletionRequestEntity({
			id: domainObject.id,
			targetRefDomain: domainObject.targetRefDomain,
			deleteAfter: domainObject.deleteAfter,
			targetRefId: domainObject.targetRefId,
			createdAt: domainObject.createdAt,
			updatedAt: domainObject.updatedAt,
			status: domainObject.status,
			batchId: domainObject.batchId,
		});
	}
}
