import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { CourseInfo } from './course-info.entity';
import { LessonInfo } from './';

@Entity({ tableName: 'homeworks' })
export class Task extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	dueDate?: Date;

	@Property()
	private?: boolean;

	@ManyToOne({ fieldName: 'courseId' })
	course: CourseInfo;

	@ManyToOne({ fieldName: 'lessonId' })
	lesson?: LessonInfo;

	@Property()
	submitted?: number;

	@Property()
	maxSubmissions?: number;

	@Property()
	graded?: number;
}
