import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionRequest } from '../../domain/deletion-request.do';
import { DeletionRequestEntity } from '../../entity';

export class DeletionRequestMapper {
	static mapToDO(entity: DeletionRequestEntity): DeletionRequest {
		return new DeletionRequest({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			source: entity.source,
			deleteAfter: entity.deleteAfter,
			userId: entity.userId?.toHexString(),
		});
	}

	static mapToEntity(domainObject: DeletionRequest): DeletionRequestEntity {
		return new DeletionRequestEntity({
			id: domainObject.id,
			source: domainObject.source,
			deleteAfter: domainObject.deleteAfter,
			userId: new ObjectId(domainObject.userId),
		});
	}

	// static mapToDOs(entities: DeletionRequestEntity[]): DeletionRequest[] {
	// 	return entities.map((entity) => this.mapToDOs(entity));
	// }

	// static mapToEntities(domainObjects: DeletionRequest[]): DeletionRequestEntity[] {
	// 	return domainObjects.map((domainObject) => this.mapToEntities(domainObject));
	// }
}
