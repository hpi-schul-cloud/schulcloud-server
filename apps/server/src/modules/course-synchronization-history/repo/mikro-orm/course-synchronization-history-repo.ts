import { EntityData, EntityName } from '@mikro-orm/core';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { CourseSynchronizationHistory } from '../../do';
import { CourseSynchronizationHistoryEntity } from '../entity';
import { CourseSynchronizationHistoryMapper } from '../mapper/course-synchronization-history.mapper';
import { CourseSynchronizationHistoryRepo } from '../course-synchronization-history-repo.interface';

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
		const entityProps = CourseSynchronizationHistoryMapper.mapDOToEntityProperties(entityDO, this.em);

		return entityProps;
	}

	public async findByExternalGroupId(externalGroupId: string): Promise<CourseSynchronizationHistory | null> {
		const entity: CourseSynchronizationHistoryEntity | null = await this.em.findOne(
			CourseSynchronizationHistoryEntity,
			{
				externalGroupId,
			}
		);

		if (!entity) {
			return null;
		}

		const domainObject = CourseSynchronizationHistoryMapper.mapEntityToDO(entity);

		return domainObject;
	}
}
