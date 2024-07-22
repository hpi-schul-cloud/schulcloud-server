import { SynchronizationEntity } from '../entity';
import { Synchronization } from '../../domain/do';

export class SynchronizationMapper {
	static mapToDO(entity: SynchronizationEntity): Synchronization {
		return new Synchronization({
			id: entity.id,
			systemId: entity.systemId,
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
			systemId: domainObject.systemId,
			createdAt: domainObject.createdAt,
			updatedAt: domainObject.updatedAt,
			count: domainObject.count,
			failureCause: domainObject.failureCause,
			status: domainObject.status,
		});
	}
}
