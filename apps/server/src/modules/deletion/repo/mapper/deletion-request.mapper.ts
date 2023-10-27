import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionRequest } from '../../domain/deletion-request.do';
import { DeletionRequestEntity } from '../../entity';

export class DeletionRequestMapper {
	static mapToDO(entity: DeletionRequestEntity): DeletionRequest {
		return new DeletionRequest({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			domain: entity.domain,
			deleteAfter: entity.deleteAfter,
			itemId: entity.itemId,
			status: entity.status,
		});
	}

	static mapToEntity(domainObject: DeletionRequest): DeletionRequestEntity {
		return new DeletionRequestEntity({
			id: domainObject.id,
			domain: domainObject.domain,
			deleteAfter: domainObject.deleteAfter,
			itemId: new ObjectId(domainObject.itemId).toHexString(),
			createdAt: domainObject.createdAt,
			updatedAt: domainObject.updatedAt,
			status: domainObject.status,
		});
	}
}
