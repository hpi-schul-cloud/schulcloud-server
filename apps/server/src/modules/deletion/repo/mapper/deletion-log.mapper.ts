import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionLogEntity } from '../../entity/deletion-log.entity';
import { DeletionLog } from '../../domain/deletion-log.do';

export class DeletionLogMapper {
	static mapToDO(entity: DeletionLogEntity): DeletionLog {
		return new DeletionLog({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			domain: entity.domain,
			operation: entity.operation,
			modifiedCounter: entity.modifiedCounter,
			deletedCounter: entity.deletedCounter,
			deletionRequestId: entity.deletionRequestId?.toHexString(),
		});
	}

	static mapToEntity(domainObject: DeletionLog): DeletionLogEntity {
		return new DeletionLogEntity({
			id: domainObject.id,
			createdAt: domainObject.createdAt,
			updatedAt: domainObject.updatedAt,
			domain: domainObject.domain,
			operation: domainObject.operation,
			modifiedCounter: domainObject.modifiedCounter,
			deletedCounter: domainObject.deletedCounter,
			deletionRequestId: new ObjectId(domainObject.deletionRequestId),
		});
	}

	static mapToDOs(entities: DeletionLogEntity[]): DeletionLog[] {
		return entities.map((entity) => this.mapToDO(entity));
	}

	static mapToEntities(domainObjects: DeletionLog[]): DeletionLogEntity[] {
		return domainObjects.map((domainObject) => this.mapToEntity(domainObject));
	}
}
