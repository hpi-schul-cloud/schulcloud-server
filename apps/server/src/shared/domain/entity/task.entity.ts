import { Collection, Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import { EntityId } from '../types';
import type { Course } from './course.entity';
import type { Lesson } from './lesson.entity';
import type { Submission } from './submission.entity';

interface ITaskProperties {
	name: string;
	dueDate?: Date;
	private?: boolean;
	parent?: Course;
	lesson?: Lesson;
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

	@ManyToOne('Course', { fieldName: 'courseId' })
	parent?: Course;

	@ManyToOne('Lesson', { fieldName: 'lessonId' })
	lesson?: Lesson; // In database exist also null, but it can not set.

	@OneToMany('Submission', 'task')
	submissions = new Collection<Submission>(this);

	constructor(props: ITaskProperties) {
		super();
		this.name = props.name;
		this.dueDate = props.dueDate;
		this.private = !!props.private;
		this.parent = props.parent;
		this.lesson = props.lesson;
		this.submissions.set(props.submissions || []);
	}
}
