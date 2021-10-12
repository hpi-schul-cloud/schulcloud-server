import { Collection, Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';
import type { Lesson } from './lesson.entity';
import type { Submission } from './submission.entity';
import { User } from './user.entity';

interface ITaskProperties {
	name: string;
	availableDate?: Date;
	dueDate?: Date;
	private?: boolean;
	teacher?: User;
	parent?: Course;
	lesson?: Lesson;
	submissions?: Submission[];
}

export type TaskParentDescriptions = { name: string; description: string; color: string };

@Entity({ tableName: 'homeworks' })
export class Task extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	availableDate?: Date;

	@Property()
	dueDate?: Date;

	@Property()
	private = true;

	@ManyToOne('User', { fieldName: 'teacherId' })
	teacher?: User;

	@ManyToOne('Course', { fieldName: 'courseId' })
	parent?: Course;

	@ManyToOne('Lesson', { fieldName: 'lessonId' })
	lesson?: Lesson; // In database exist also null, but it can not set.

	@OneToMany('Submission', 'task')
	submissions = new Collection<Submission>(this);

	isDraft(): boolean {
		// private can be undefined in the database
		return !!this.private;
	}

	getDescriptions(): TaskParentDescriptions {
		let descriptions: TaskParentDescriptions;
		if (this.parent) {
			descriptions = this.parent.getDescriptions();
		} else {
			descriptions = {
				name: '',
				description: '',
				color: '#ACACAC',
			};
		}
		return descriptions;
	}

	constructor(props: ITaskProperties) {
		super();
		this.name = props.name;
		this.availableDate = props.availableDate;
		this.dueDate = props.dueDate;
		if (props.private !== undefined) this.private = props.private;
		this.teacher = props.teacher;
		this.parent = props.parent;
		this.lesson = props.lesson;
		this.submissions.set(props.submissions || []);
	}
}
