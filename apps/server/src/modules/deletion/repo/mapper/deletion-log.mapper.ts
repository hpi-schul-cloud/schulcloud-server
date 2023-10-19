import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionLogEntity } from '../../entities/deletion-log.entity';
import { DeletionLog } from '../../domain/deletion-log.do';

export class DeletionLogMapper {
	static mapToDO(entity: DeletionLogEntity): DeletionLog {
		return new DeletionLog({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			scope: entity.scope,
			operation: entity.operation,
			docIds: entity.docIds?.map((docId) => docId.toHexString()),
			deletionRequestId: entity.deletionRequestId?.toHexString(),
		});
	}

	static mapToEntity(domainObject: DeletionLog): DeletionLogEntity {
		return new DeletionLogEntity({
			id: domainObject.id,
			createdAt: domainObject.createdAt,
			updatedAt: domainObject.updatedAt,
			scope: domainObject.scope,
			operation: domainObject.operation,
			docIds: domainObject.docIds?.map((docId) => new ObjectId(docId)),
			deletionRequestId: new ObjectId(domainObject.deletionRequestId),
		});
	}

	// static mapToDOs(entities: DeletionLogEntity[]): DeletionLog[] {
	// 	return entities.map((entity) => this.mapToDO(entity));
	// }

	// static mapToEntities(domainObjects: DeletionLog[]): DeletionLogEntity[] {
	// 	return domainObjects.map((domainObject) => this.mapToEntity(domainObject));
	// }
}
