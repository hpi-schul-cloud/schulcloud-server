import { BaseEntityWithTimestamps } from '@shared/domain';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { CourseInfo } from './course-info.entity';

@Entity({ tableName: 'lessons' })
export class LessonInfo extends BaseEntityWithTimestamps {
	@Property()
	hidden: boolean;

	@ManyToOne({ fieldName: 'courseId' })
	course: CourseInfo;
}
