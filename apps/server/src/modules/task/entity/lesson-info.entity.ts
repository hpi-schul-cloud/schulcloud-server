import { BaseEntityWithTimestamps } from '@shared/domain';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { CourseTaskInfo } from './course-task-info.entity';

@Entity({ tableName: 'lessons' })
export class LessonInfo extends BaseEntityWithTimestamps {
	@Property()
	hidden: boolean;

	@ManyToOne({ fieldName: 'courseId' })
	course: CourseTaskInfo;
}
