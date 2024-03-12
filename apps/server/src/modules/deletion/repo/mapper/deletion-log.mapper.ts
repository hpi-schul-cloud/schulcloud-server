import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionLog } from '../../domain';
import { DeletionLogEntity } from '../../entity';

export class DeletionLogMapper {
	static mapToDO(entity: DeletionLogEntity): DeletionLog {
		return new DeletionLog({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			domain: entity.domain,
			operations: entity.operations,
			subdomainOperations: entity.subdomainOperations,
			deletionRequestId: entity.deletionRequestId.toHexString(),
			performedAt: entity.performedAt,
		});
	}

	static mapToEntity(domainObject: DeletionLog): DeletionLogEntity {
		return new DeletionLogEntity({
			id: domainObject.id,
			createdAt: domainObject.createdAt,
			updatedAt: domainObject.updatedAt,
			domain: domainObject.domain,
			operations: domainObject.operations,
			subdomainOperations: domainObject.subdomainOperations,
			deletionRequestId: new ObjectId(domainObject.deletionRequestId),
			performedAt: domainObject.performedAt,
		});
	}

	static mapToDOs(entities: DeletionLogEntity[]): DeletionLog[] {
		return entities.map((entity) => this.mapToDO(entity));
	}

	static mapToEntities(domainObjects: DeletionLog[]): DeletionLogEntity[] {
		return domainObjects.map((domainObject) => this.mapToEntity(domainObject));
	}
}
