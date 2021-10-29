import { Collection, Entity, ManyToOne, OneToMany, ManyToMany, Property } from '@mikro-orm/core';

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

export interface ITaskStatus {
	submitted: number;
	maxSubmissions: number;
	graded: number;
	isDraft: boolean;
	isSubstitutionTeacher: boolean;
}

export class TaskWithStatusVo {
	task!: Task;

	status!: ITaskStatus;

	constructor(task: Task, status: ITaskStatus) {
		this.task = task;
		this.status = status;
	}
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
	course?: Course;

	@ManyToOne('Lesson', { fieldName: 'lessonId' })
	lesson?: Lesson; // In database exist also null, but it can not set.

	@OneToMany('Submission', 'task')
	submissions = new Collection<Submission>(this);

	// TODO: is mapped to boolean in future
	@ManyToMany('User', undefined, { fieldName: 'archived' })
	closed = new Collection<User>(this);

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

	isDraft(): boolean {
		// private can be undefined in the database
		return !!this.private;
	}

	private getSubmissionItems(): Submission[] {
		// TODO: load/init check until mikro-orm base entity is extended
		return this.submissions.getItems();
	}

	getSubmittedUserIds(): EntityId[] {
		const submittedUserIds = this.getSubmissionItems().map((submission) => submission.getStudentId());

		return submittedUserIds;
	}

	getNumberOfSubmittedUsers(): number {
		const submittedUserIds = this.getSubmittedUserIds();
		const submitted = [...new Set(submittedUserIds)].length;

		return submitted;
	}

	getGradedUserIds(): EntityId[] {
		const gradedUserIds = this.getSubmissionItems()
			.filter((submission) => submission.isGraded())
			.map((submission) => submission.getStudentId());

		return gradedUserIds;
	}

	getNumberOfGradedUsers(): number {
		const gradedUserIds = this.getGradedUserIds();
		const graded = [...new Set(gradedUserIds)].length;

		return graded;
	}

	// attention based on this parent use this.getParent() instant
	getMaxSubmissions(): number {
		// hack until parents are defined
		return this.course ? this.course.getNumberOfStudents() : 0;
	}

	createTeacherStatusForUser(userId: EntityId): ITaskStatus {
		const submitted = this.getNumberOfSubmittedUsers();
		const graded = this.getNumberOfGradedUsers();
		const maxSubmissions = this.getMaxSubmissions();
		const isDraft = this.isDraft();
		// only point that need the parameter
		// const isSubstitutionTeacher = this.isSubstitutionTeacher(userId);
		// work with getParent()
		let isSubstitutionTeacher = false;
		if (this.course) {
			isSubstitutionTeacher = this.course.getSubstitutionTeacherIds().includes(userId);
		}

		const status = {
			submitted,
			graded,
			maxSubmissions,
			isDraft,
			isSubstitutionTeacher,
		};

		return status;
	}

	isSubmittedForUser(userId: EntityId): boolean {
		const submitted = this.getSubmittedUserIds().some((id) => userId === id);

		return submitted;
	}

	isGradedForUser(userId: EntityId): boolean {
		const graded = this.getGradedUserIds().some((id) => userId === id);

		return graded;
	}

	createStudentStatusForUser(userId: EntityId): ITaskStatus {
		const isSubmitted = this.isSubmittedForUser(userId);
		const isGraded = this.isGradedForUser(userId);
		const maxSubmissions = 1;
		const isDraft = this.isDraft();
		const isSubstitutionTeacher = false;

		const status = {
			submitted: isSubmitted ? 1 : 0,
			graded: isGraded ? 1 : 0,
			maxSubmissions,
			isDraft,
			isSubstitutionTeacher,
		};

		return status;
	}

	// TODO: based on the parent relationship
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
}
