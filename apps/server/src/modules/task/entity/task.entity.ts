import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { CourseTaskInfo } from './course-task-info.entity';
import { LessonTaskInfo } from './lesson-task-info.entity';

@Entity({ tableName: 'homeworks' })
export class Task extends BaseEntityWithTimestamps {
	constructor(partial: Partial<Task>) {
		super();
		Object.assign(this, partial);
	}

	@Property()
	name: string;

	@Property()
	dueDate?: Date;

	@Property()
	private?: boolean;

	@ManyToOne({ fieldName: 'courseId' })
	course: CourseTaskInfo;

	@ManyToOne({ fieldName: 'lessonId' })
	lesson?: LessonTaskInfo;
}
