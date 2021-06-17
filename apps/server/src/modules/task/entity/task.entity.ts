import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { Course } from './course.entity';
import { Lesson } from './lesson.entity';

@Entity({ tableName: 'homeworks' })
export class Task extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	dueDate?: Date;

	@Property()
	private?: boolean;

	@ManyToOne({ fieldName: 'courseId' })
	course: Course;

	@ManyToOne({ fieldName: 'lessonId' })
	lesson?: Lesson;

	@Property()
	submitted?: number;

	@Property()
	maxSubmissions?: number;

	@Property()
	graded?: number;
}
