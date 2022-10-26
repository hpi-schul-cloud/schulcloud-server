import { Collection, Entity, Index, ManyToMany, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { School } from '@shared/domain/entity/school.entity';
import { IEntityWithSchool } from '../interface';
import { ILearnroomElement } from '../interface/learnroom';
import { EntityId } from '../types/entity-id';
import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';
import type { File } from './file.entity';
import type { Lesson } from './lesson.entity';
import type { Submission } from './submission.entity';
import type { User } from './user.entity';

export interface ITaskProperties {
	name: string;
	description?: string;
	availableDate?: Date;
	dueDate?: Date;
	private?: boolean;
	creator: User;
	course?: Course;
	school: School;
	lesson?: Lesson;
	submissions?: Submission[];
	finished?: User[];
	files?: File[];
	publicSubmissions?: boolean;
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

export type TaskParentDescriptions = {
	courseName: string;
	courseId: string;
	lessonName: string;
	lessonHidden: boolean;
	color: string;
};

@Entity({ tableName: 'homeworks' })
@Index({ properties: ['private', 'dueDate', 'finished'] })
@Index({ properties: ['id', 'private'] })
@Index({ properties: ['finished', 'course'] })
@Index({ properties: ['finished', 'course'] })
export class Task extends BaseEntityWithTimestamps implements ILearnroomElement, IEntityWithSchool {
	@Property()
	name: string;

	@Property()
	description: string;

	@Property({ nullable: true })
	availableDate?: Date;

	@Property({ nullable: true })
	@Index()
	dueDate?: Date;

	@Property()
	private = true;

	@Property({ nullable: true })
	publicSubmissions?: boolean;

	@Index()
	@ManyToOne('User', { fieldName: 'teacherId', nullable: true })
	creator?: User;

	@Index()
	@ManyToOne('Course', { fieldName: 'courseId', nullable: true, eager: true })
	course?: Course;

	@Index()
	@ManyToOne('School', { fieldName: 'schoolId' })
	school: School;

	@Index()
	@ManyToOne('Lesson', { fieldName: 'lessonId', nullable: true })
	lesson?: Lesson; // In database exist also null, but it can not set.

	@OneToMany('Submission', 'task', { orphanRemoval: true })
	submissions = new Collection<Submission>(this);

	@Index()
	@ManyToMany('User', undefined, { fieldName: 'archived' })
	finished = new Collection<User>(this);

	@ManyToMany('File', undefined, { fieldName: 'fileIds', nullable: true })
	files = new Collection<File>(this);

	constructor(props: ITaskProperties) {
		super();
		this.name = props.name;
		this.description = props.description || '';
		this.availableDate = props.availableDate;
		this.dueDate = props.dueDate;
		if (props.private !== undefined) this.private = props.private;
		this.creator = props.creator;
		this.course = props.course;
		this.school = props.school;
		this.lesson = props.lesson;
		this.submissions.set(props.submissions || []);
		this.finished.set(props.finished || []);
		this.files.set(props.files || []);
		this.publicSubmissions = props.publicSubmissions || false;
	}

	isFinishedForUser(user: User): boolean {
		return !!(this.finished?.contains(user) || this.course?.isFinished());
	}

	isDraft(): boolean {
		// private can be undefined in the database
		return !!this.private;
	}

	isPublished(): boolean {
		if (this.isDraft()) {
			return false;
		}
		if (this.availableDate && this.availableDate > new Date(Date.now())) {
			return false;
		}
		return true;
	}

	isPlanned(): boolean {
		if (this.isDraft()) {
			return false;
		}
		if (this.availableDate && this.availableDate > new Date(Date.now())) {
			return true;
		}
		return false;
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
	getParentData(): TaskParentDescriptions {
		let descriptions: TaskParentDescriptions;
		if (this.course) {
			descriptions = {
				courseName: this.course.name,
				courseId: this.course.id,
				lessonName: this.lesson ? this.lesson.name : '',
				lessonHidden: this.lesson ? this.lesson.hidden : false,
				color: this.course.color,
			};
		} else {
			descriptions = {
				courseName: '',
				courseId: '',
				lessonName: '',
				lessonHidden: false,
				color: '#ACACAC',
			};
		}

		return descriptions;
	}

	private getFileItems(): File[] {
		if (!this.files.isInitialized(true)) {
			throw new Error('File items are not loaded.');
		}
		const files = this.files.getItems();
		return files;
	}

	getFileNames(): string[] {
		const attachedFileIds = this.getFileItems().map((file) => file.name);
		return attachedFileIds;
	}

	finishForUser(user: User) {
		this.finished.add(user);
	}

	restoreForUser(user: User) {
		this.finished.remove(user);
	}

	getSchoolId(): EntityId {
		return this.school.id;
	}

	publish() {
		this.private = false;
		this.availableDate = new Date(Date.now());
	}

	unpublish() {
		this.private = true;
	}
}
