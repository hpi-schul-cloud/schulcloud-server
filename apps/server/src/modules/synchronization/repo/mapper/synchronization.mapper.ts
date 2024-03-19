import { Synchronization } from '../../domain';
import { SynchronizationEntity } from '../../entity';

export class SynchronizationMapper {
	static mapToDO(entity: SynchronizationEntity): Synchronization {
		return new Synchronization({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			count: entity.count,
			failureCause: entity?.failureCause,
			status: entity?.status,
		});
	}

	static mapToEntity(domainObject: Synchronization): SynchronizationEntity {
		return new SynchronizationEntity({
			id: domainObject.id,
			createdAt: domainObject.createdAt,
			updatedAt: domainObject.updatedAt,
			count: domainObject.count,
			failureCause: domainObject.failureCause,
			status: domainObject.status,
		});
	}
}
