import { BaseEntityWithTimestamps } from '@shared/domain';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { Course } from './course.entity';

@Entity({ tableName: 'lessons' })
export class Lesson extends BaseEntityWithTimestamps {
	@Property()
	hidden: boolean;

	@ManyToOne({ fieldName: 'courseId' })
	course: Course;
}
