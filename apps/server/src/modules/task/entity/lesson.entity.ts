import { BaseEntityWithTimestamps } from '../../../shared/domain';
import { Collection, Entity, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';
import { UserInfo } from '../../news/entity';
import { Course } from './course.entity';

@Entity({ tableName: 'lessons' })
export class Lesson extends BaseEntityWithTimestamps {
	@Property()
	hidden: boolean;
	@ManyToOne({ fieldName: 'courseId' })
	course: Course;
}
