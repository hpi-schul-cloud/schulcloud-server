import { SynchronizationEntity } from '../../entity';
import { Synchronization } from '../../domain';

export class SynchronizationMapper {
	static mapToDO(entity: SynchronizationEntity): Synchronization {
		return new Synchronization({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			count: entity.count,
			failure: entity.failure,
		});
	}

	static mapToEntity(domainObject: Synchronization): SynchronizationEntity {
		return new SynchronizationEntity({
			id: domainObject.id,
			createdAt: domainObject.createdAt,
			updatedAt: domainObject.updatedAt,
			count: domainObject.count,
			failure: domainObject.failure,
		});
	}
}
