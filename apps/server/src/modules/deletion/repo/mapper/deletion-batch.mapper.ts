import { DeletionBatch } from '../../domain/do';
import { DeletionBatchEntity } from '../entity';

// TODO: tests missing
export class DeletionBatchMapper {
	static mapToDO(entity: DeletionBatchEntity): DeletionBatch {
		return new DeletionBatch({
			id: entity.id,
			deletionRequestIds: entity.deletionRequestIds,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		});
	}

	static mapToEntity(domainObject: DeletionBatch): DeletionBatchEntity {
		return new DeletionBatchEntity({
			id: domainObject.id,
			deletionRequestIds: domainObject.deletionRequestIds,
			createdAt: domainObject.createdAt,
			updatedAt: domainObject.updatedAt,
		});
	}
}