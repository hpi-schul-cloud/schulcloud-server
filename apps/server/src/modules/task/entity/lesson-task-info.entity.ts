import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';
import { Entity, Property } from '@mikro-orm/core';

@Entity({ tableName: 'lessons' })
export class LessonTaskInfo extends BaseEntityWithTimestamps {
	@Property()
	hidden: boolean;

	@Property()
	courseId: EntityId;
}

// TODO: should remove from this place ..it is not part of task
