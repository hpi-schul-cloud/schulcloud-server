import { Entity, Property, Index } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';
import { LessonTaskInfo } from './lesson-task-info.entity';

type TaskProperties = {
	name?: string;
	dueDate?: Date;
	private?: boolean;
	courseId?: EntityId;
	lesson?: LessonTaskInfo;
	schoolId: EntityId;
};

@Index({ name: 'TaskRepo_getOpenTaskByCourseListAndLessonList', properties: ['schoolId', 'courseId'] })
@Entity({ tableName: 'homeworks' })
export class Task extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	dueDate?: Date | null;

	@Property()
	private?: boolean;

	@Property()
	courseId?: EntityId | null;

	@Property()
	lessonId?: LessonTaskInfo | null;

	@Property()
	schoolId: EntityId;

	constructor(props: TaskProperties) {
		super();
		this.name = props.name || 'Kurse';
		this.dueDate = props.dueDate || null;
		this.private = props.private || true;
		this.courseId = props.courseId || null;
		this.lessonId = props.lesson || null;
		this.schoolId = props.schoolId;

		Object.assign(this, {});
	}
}
