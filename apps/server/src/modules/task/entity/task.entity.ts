import { Collection, Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId, Course } from '@shared/domain';
import type { Submission } from './submission.entity';
import { LessonTaskInfo } from './lesson-task-info.entity';

interface ITaskProperties {
	name: string;
	dueDate?: Date;
	private?: boolean;
	parent?: Course;
	lesson?: LessonTaskInfo;
	submissions?: Submission[];
}

export interface IParentDescriptionsProperties {
	id: EntityId;
	name: string;
	color: string;
	description?: string;
}

export interface ITaskParent {
	id: EntityId;

	hasWritePermission(userId: EntityId): boolean;
	getDescriptions(): IParentDescriptionsProperties;
	getNumberOfStudents(): number;
}

@Entity({ tableName: 'homeworks' })
export class Task extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	dueDate?: Date;

	@Property()
	private = true;

	@ManyToOne({ fieldName: 'courseId' })
	parent?: Course;

	@ManyToOne({ fieldName: 'lessonId' })
	lesson?: LessonTaskInfo; // In database exist also null, but it can not set.

	@OneToMany('Submission', 'task')
	submissions = new Collection<Submission>(this);

	constructor(props: ITaskProperties) {
		super();
		this.name = props.name;
		this.dueDate = props.dueDate;
		this.private = !!props.private;
		this.parent = props.parent;
		this.lesson = props.lesson;
		this.submissions = new Collection<Submission>(this, props.submissions || []);
	}
}
