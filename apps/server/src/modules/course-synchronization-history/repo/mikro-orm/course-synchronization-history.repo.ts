import { EntityData, EntityName } from '@mikro-orm/core';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { CourseSynchronizationHistory } from '../../domain';
import { CourseSynchronizationHistoryRepo } from '../course-synchronization-history.repo.interface';
import { CourseSynchronizationHistoryEntity } from '../entity';
import { CourseSynchronizationHistoryMapper } from '../mapper';

export class CourseSynchronizationHistoryMirkoOrmRepo
	extends BaseDomainObjectRepo<CourseSynchronizationHistory, CourseSynchronizationHistoryEntity>
	implements CourseSynchronizationHistoryRepo
{
	protected get entityName(): EntityName<CourseSynchronizationHistoryEntity> {
		return CourseSynchronizationHistoryEntity;
	}

	protected mapDOToEntityProperties(
		entityDO: CourseSynchronizationHistory
	): EntityData<CourseSynchronizationHistoryEntity> {
		const entityProps = CourseSynchronizationHistoryMapper.mapDOToEntityProperties(entityDO);

		return entityProps;
	}

	public async findByExternalGroupId(externalGroupId: string): Promise<CourseSynchronizationHistory[]> {
		const entities: CourseSynchronizationHistoryEntity[] = await this.em.find(CourseSynchronizationHistoryEntity, {
			externalGroupId,
		});

		if (!entities.length) {
			return [];
		}

		const domainObjects = entities.map((entity: CourseSynchronizationHistoryEntity) =>
			CourseSynchronizationHistoryMapper.mapEntityToDO(entity)
		);

		return domainObjects;
	}
}
