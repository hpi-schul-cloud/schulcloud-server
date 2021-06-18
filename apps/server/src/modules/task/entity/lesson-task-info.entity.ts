import { BaseEntityWithTimestamps } from '@shared/domain';
import { Entity, Property } from '@mikro-orm/core';
import { CourseTaskInfo } from './course-task-info.entity';

@Entity({ tableName: 'lessons' })
export class LessonTaskInfo extends BaseEntityWithTimestamps {
	@Property()
	hidden: boolean;

	@Property()
	course: CourseTaskInfo;
}
