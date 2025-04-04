import { EntityData } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { CourseEntity } from '@modules/course/repo';
import { CourseSynchronizationHistory } from '../../do';
import { CourseSynchronizationHistoryEntity } from '../entity';

export class CourseSynchronizationHistoryMapper {
	public static mapEntityToDO(entity: CourseSynchronizationHistoryEntity): CourseSynchronizationHistory {
		const domainObject = new CourseSynchronizationHistory({
			id: entity.id,
			externalGroupId: entity.externalGroupId,
			synchronizedCourse: entity.synchronizedCourse.id,
			expiresAt: entity.expiresAt,
			excludeFromSync: entity.excludeFromSync,
		});

		return domainObject;
	}

	public static mapDOToEntityProperties(
		domainObject: CourseSynchronizationHistory,
		em: EntityManager
	): EntityData<CourseSynchronizationHistoryEntity> {
		const props: EntityData<CourseSynchronizationHistoryEntity> = {
			externalGroupId: domainObject.externalGroupId,
			synchronizedCourse: em.getReference(CourseEntity, domainObject.synchronizedCourse),
			expiresAt: domainObject.expiresAt,
			excludeFromSync: domainObject.excludeFromSync,
		};

		return props;
	}
}
