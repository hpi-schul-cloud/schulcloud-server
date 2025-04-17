import { EntityData } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { CourseSynchronizationHistory } from '../../domain';
import { CourseSynchronizationHistoryEntity } from '../entity';

export class CourseSynchronizationHistoryMapper {
	public static mapEntityToDO(entity: CourseSynchronizationHistoryEntity): CourseSynchronizationHistory {
		const domainObject = new CourseSynchronizationHistory({
			id: entity.id,
			externalGroupId: entity.externalGroupId,
			synchronizedCourse: entity.synchronizedCourse.toHexString(),
			expiresAt: entity.expiresAt,
			excludeFromSync: entity.excludeFromSync,
		});

		return domainObject;
	}

	public static mapDOToEntityProperties(
		domainObject: CourseSynchronizationHistory
	): EntityData<CourseSynchronizationHistoryEntity> {
		const props: EntityData<CourseSynchronizationHistoryEntity> = {
			externalGroupId: domainObject.externalGroupId,
			synchronizedCourse: new ObjectId(domainObject.synchronizedCourse),
			expiresAt: domainObject.expiresAt,
			excludeFromSync: domainObject.excludeFromSync,
		};

		return props;
	}
}
