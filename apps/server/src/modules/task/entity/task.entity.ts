import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { CourseTaskInfo } from './course-task-info.entity';
import { LessonInfo } from './lesson-info.entity';

@Entity({ tableName: 'homeworks' })
export class Task extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	dueDate?: Date;

	@Property()
	private?: boolean;

	@ManyToOne({ fieldName: 'courseId' })
	course: CourseTaskInfo;

	@ManyToOne({ fieldName: 'lessonId' })
	lesson?: LessonInfo;

	@Property()
	submitted?: number;

	@Property()
	maxSubmissions?: number;

	@Property()
	graded?: number;
}
