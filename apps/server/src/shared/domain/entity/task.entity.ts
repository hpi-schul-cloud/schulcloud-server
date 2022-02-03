import { Collection, Entity, ManyToOne, OneToMany, ManyToMany, Property, Index } from '@mikro-orm/core';
import { EntityId } from '../types/entity-id';

import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';
import type { Lesson } from './lesson.entity';
import type { Submission } from './submission.entity';
import type { User } from './user.entity';

export interface ITaskProperties {
	name: string;
	availableDate?: Date;
	dueDate?: Date;
	private?: boolean;
	creator?: User;
	course?: Course;
	lesson?: Lesson;
	submissions?: Submission[];
	finished?: User[];
}

export interface ITaskStatus {
	submitted: number;
	maxSubmissions: number;
	graded: number;
	isDraft: boolean;
	isSubstitutionTeacher: boolean;
	isFinished: boolean;
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
@Index({ name: 'findAllByParentIds_findAllForStudent', properties: ['private', 'dueDate', 'finished'] })
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
	creator?: User;

	@ManyToOne('Course', { fieldName: 'courseId' })
	course?: Course;

	@ManyToOne('Lesson', { fieldName: 'lessonId' })
	lesson?: Lesson; // In database exist also null, but it can not set.

	@OneToMany('Submission', 'task')
	submissions = new Collection<Submission>(this);

	// TODO: rename to finished
	@Index({ name: 'findAllByParentIds_findAllForTeacher' })
	@ManyToMany('User', undefined, { fieldName: 'archived' })
	finished = new Collection<User>(this);

	constructor(props: ITaskProperties) {
		super();
		this.name = props.name;
		this.availableDate = props.availableDate;
		this.dueDate = props.dueDate;
		if (props.private !== undefined) this.private = props.private;
		this.creator = props.creator;
		this.course = props.course;
		this.lesson = props.lesson;
		this.submissions.set(props.submissions || []);
		this.finished.set(props.finished || []);
	}

	isFinishedForUser(user: User): boolean {
		return !!(this.finished?.contains(user) || this.course?.isFinished());
	}

	isDraft(): boolean {
		// private can be undefined in the database
		return !!this.private;
	}

	private getSubmissionItems(): Submission[] {
		if (!this.submissions.isInitialized(true)) {
			throw new Error('Submissions items are not loaded.');
		}
		const submissions = this.submissions.getItems();
		return submissions;
	}

	getSubmittedUserIds(): EntityId[] {
		const submittedUserIds = this.getSubmissionItems().map((submission) => submission.student.id);
		const uniqueSubmittedUserIds = [...new Set(submittedUserIds)];

		return uniqueSubmittedUserIds;
	}

	getNumberOfSubmittedUsers(): number {
		const submittedUserIds = this.getSubmittedUserIds();
		const count = submittedUserIds.length;

		return count;
	}

	getGradedUserIds(): EntityId[] {
		const gradedUserIds = this.getSubmissionItems()
			.filter((submission) => submission.isGraded())
			.map((submission) => submission.student.id);
		const uniqueGradedUserIds = [...new Set(gradedUserIds)];

		return uniqueGradedUserIds;
	}

	getNumberOfGradedUsers(): number {
		const gradedUserIds = this.getGradedUserIds();
		const count = gradedUserIds.length;

		return count;
	}

	// attention based on this parent use this.getParent() instant
	getMaxSubmissions(): number {
		// hack until parents are defined
		const numberOfStudents = this.course ? this.course.getNumberOfStudents() : 0;

		return numberOfStudents;
	}

	createTeacherStatusForUser(user: User): ITaskStatus {
		const submitted = this.getNumberOfSubmittedUsers();
		const graded = this.getNumberOfGradedUsers();
		const maxSubmissions = this.getMaxSubmissions();
		const isDraft = this.isDraft();
		const isFinished = this.isFinishedForUser(user);
		// only point that need the parameter
		// const isSubstitutionTeacher = this.isSubstitutionTeacher(userId);
		// work with getParent()
		let isSubstitutionTeacher = false;
		if (this.course) {
			isSubstitutionTeacher = this.course.substitutionTeachers.contains(user);
		}

		const status = {
			submitted,
			graded,
			maxSubmissions,
			isDraft,
			isSubstitutionTeacher,
			isFinished,
		};

		return status;
	}

	isSubmittedForUser(user: User): boolean {
		const submitted = this.getSubmittedUserIds().some((uid) => uid === user.id);

		return submitted;
	}

	isGradedForUser(user: User): boolean {
		const graded = this.getGradedUserIds().some((uid) => uid === user.id);

		return graded;
	}

	createStudentStatusForUser(user: User): ITaskStatus {
		const isSubmitted = this.isSubmittedForUser(user);
		const isGraded = this.isGradedForUser(user);
		const maxSubmissions = 1;
		const isDraft = this.isDraft();
		const isSubstitutionTeacher = false;
		const isFinished = this.isFinishedForUser(user);

		const status = {
			submitted: isSubmitted ? 1 : 0,
			graded: isGraded ? 1 : 0,
			maxSubmissions,
			isDraft,
			isSubstitutionTeacher,
			isFinished,
			// TODO: visibility of parent is missed ..but isSubstitutionTeacher and this is not really a part from task,
			// for this we must add parent relationship
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

	finishForUser(user: User) {
		if (!this.isFinishedForUser(user)) {
			this.finished.add(user);
		}
	}

	restoreForUser(user: User) {
		if (this.isFinishedForUser(user)) {
			this.finished.remove(user);
		}
	}
}
