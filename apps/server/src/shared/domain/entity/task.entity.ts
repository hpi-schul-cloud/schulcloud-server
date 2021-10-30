import { Collection, Entity, ManyToOne, OneToMany, ManyToMany, Property, Index } from '@mikro-orm/core';

import { EntityId } from '../types';

import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';
import type { Lesson } from './lesson.entity';
import type { Submission } from './submission.entity';
import { User } from './user.entity';

export interface ITaskProperties {
	name: string;
	availableDate?: Date;
	dueDate?: Date;
	private?: boolean;
	teacher?: User;
	course?: Course;
	lesson?: Lesson;
	submissions?: Submission[];
	closed?: User[];
}

export type TaskParentDescriptions = { name: string; description: string; color: string };

@Entity({ tableName: 'homeworks' })
@Index({ name: 'findAllByParentIds1', properties: ['draft', 'dueDate', 'closed'] })
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
	course?: Course;

	@ManyToOne('Lesson', { fieldName: 'lessonId' })
	lesson?: Lesson; // In database exist also null, but it can not set.

	@OneToMany('Submission', 'task')
	submissions = new Collection<Submission>(this);

	// TODO: is mapped to boolean in future
	@Index({ name: 'findAllByParentIds2' })
	@ManyToMany('User', undefined, { fieldName: 'archived' })
	closed = new Collection<User>(this);

	isDraft(): boolean {
		// private can be undefined in the database
		return !!this.private;
	}

	isSubstitutionTeacher(userId: EntityId): boolean {
		if (!this.course) {
			return false;
		}
		// TODO: check if it is loaded if not load it ...isInitialized() is only work for collections, await ...init() also
		const isSubstitutionTeacher = this.course.isSubstitutionTeacher(userId);
		return isSubstitutionTeacher;
	}

	getDescriptions(): TaskParentDescriptions {
		let descriptions: TaskParentDescriptions;
		if (this.course) {
			descriptions = {
				name: this.course.name,
				description: this.lesson ? this.lesson.name : '',
				color: this.course.color,
			};
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
		this.course = props.course;
		this.lesson = props.lesson;
		this.submissions.set(props.submissions || []);
		// TODO: is replaced with boolean in future
		this.closed.set(props.closed || []);
	}
}
