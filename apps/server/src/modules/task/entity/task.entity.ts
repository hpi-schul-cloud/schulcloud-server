import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';
import { LessonTaskInfo } from './lesson-task-info.entity';

interface ITaskProperties {
	name: string;
	dueDate?: Date;
	private?: boolean;
	courseId: EntityId;
	lesson?: LessonTaskInfo;
}

@Entity({ tableName: 'homeworks' })
export class Task extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	dueDate?: Date;

	@Property()
	private?: boolean;

	@Property()
	courseId: EntityId;

	@ManyToOne({ fieldName: 'lessonId' })
	lesson?: LessonTaskInfo; // In database exist also null, but it can not set.

	constructor(props: ITaskProperties) {
		super();
		this.name = props.name;
		this.dueDate = props.dueDate;
		this.private = props.private;
		this.courseId = props.courseId;
		Object.assign(this, { lesson: props.lesson });
	}
}
