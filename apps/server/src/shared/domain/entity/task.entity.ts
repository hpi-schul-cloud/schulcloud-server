import { Collection, Entity, Index, ManyToMany, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { School } from '@shared/domain/entity/school.entity';
import { InputFormat } from '@shared/domain/types/input-format.types';
import type { IEntityWithSchool } from '../interface';
import type { ILearnroomElement } from '../interface/learnroom';
import type { EntityId } from '../types/entity-id';
import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';
import type { Lesson } from './lesson.entity';
import type { Submission } from './submission.entity';
import type { User } from './user.entity';
import type { ITaskProperties, ITaskStatus } from '../types/task.types';

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

export interface ITaskParent {
	getStudentIds(): EntityId[];
}

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

	@Property()
	descriptionInputFormat: InputFormat;

	@Property({ nullable: true })
	availableDate?: Date;

	@Property({ nullable: true })
	@Index()
	dueDate?: Date;

	@Property()
	private = true;

	@Index()
	@ManyToOne('User', { fieldName: 'teacherId' })
	creator: User;

	@Index()
	@ManyToOne('Course', { fieldName: 'courseId', nullable: true })
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

	constructor(props: ITaskProperties) {
		super();
		this.name = props.name;
		this.description = props.description || '';
		this.descriptionInputFormat = props.descriptionInputFormat || InputFormat.RICH_TEXT_CK4;
		this.availableDate = props.availableDate;
		this.dueDate = props.dueDate;
		if (props.private !== undefined) this.private = props.private;
		this.creator = props.creator;
		this.course = props.course;
		this.school = props.school;
		this.lesson = props.lesson;
		this.submissions.set(props.submissions || []);
		this.finished.set(props.finished || []);
	}

	private getSubmissionItems(): Submission[] {
		if (!this.submissions.isInitialized(true)) {
			throw new Error('Submissions items are not loaded.');
		}
		const submissions = this.submissions.getItems();

		return submissions;
	}

	private getFinishedUserIds(): EntityId[] {
		const finishedObjectIds = this.finished.getIdentifiers('_id');
		const finishedIds = finishedObjectIds.map((id) => id.toString());

		return finishedIds;
	}

	private getParent(): ITaskParent {
		const parent = this.lesson || this.course || this.creator;

		return parent;
	}

	private getStudentIds(): EntityId[] {
		const parent = this.getParent();
		const studentIds = parent.getStudentIds();

		return studentIds;
	}

	private isFinishedForUser(user: User): boolean {
		const finishedUserIds = this.getFinishedUserIds();
		const finishedCourse = this.course?.isFinished();
		const finishedForUser = finishedUserIds.some((finishedUserId) => finishedUserId === user.id);
		const isFinishedForUser = !!(finishedForUser || finishedCourse);

		return isFinishedForUser;
	}

	public isDraft(): boolean {
		// private can be undefined in the database
		return !!this.private;
	}

	public isPublished(): boolean {
		if (this.isDraft()) {
			return false;
		}
		if (this.availableDate && this.availableDate > new Date(Date.now())) {
			return false;
		}

		return true;
	}

	// <---------------------------- next test for refactoring ---------------------------->
	public isPlanned(): boolean {
		if (this.isDraft()) {
			return false;
		}
		if (this.availableDate && this.availableDate > new Date(Date.now())) {
			return true;
		}

		return false;
	}

	private getSubmittedSubmissions(): Submission[] {
		const submissions = this.getSubmissionItems();
		const gradedSubmissions = submissions.filter((submission) => submission.isSubmitted());

		return gradedSubmissions;
	}

	private getGradedSubmissions(): Submission[] {
		const submissions = this.getSubmissionItems();
		const gradedSubmissions = submissions.filter((submission) => submission.isGraded());

		return gradedSubmissions;
	}

	private isSubmittedForUser(user: User): boolean {
		const submissions = this.getSubmissionItems();
		const isSubmitted = submissions.some((submission) => submission.isSubmittedForUser(user));

		return isSubmitted;
	}

	private isGradedForUser(user: User): boolean {
		const submissions = this.getSubmissionItems();
		const graded = submissions.some((submission) => submission.isGradedForUser(user));

		return graded;
	}

	private getListOfSubmittedUserIds(): EntityId[] {
		let submittedUserIds: EntityId[] = [];
		const submittedSubmissions = this.getSubmittedSubmissions();

		submittedSubmissions.forEach((submission) => {
			const memberUserIds = submission.getMemberUserIds();
			submittedUserIds = [...submittedUserIds, ...memberUserIds];
		});

		const uniqueSubmittedUserIds = [...new Set(submittedUserIds)];

		return uniqueSubmittedUserIds;
	}

	private getListOfGradeddUserIds(): EntityId[] {
		let gradedUserIds: EntityId[] = [];
		const gradedSubmissions = this.getGradedSubmissions();

		gradedSubmissions.forEach((submission) => {
			const memberUserIds = submission.getMemberUserIds();
			gradedUserIds = [...gradedUserIds, ...memberUserIds];
		});

		const uniqueGradedUserIds = [...new Set(gradedUserIds)];

		return uniqueGradedUserIds;
	}

	private userIsSubstitutionTeacher(user: User): boolean {
		const isSubstitutionTeacher = this.course ? this.course.userIsSubstitutionTeacher(user) : false;

		return isSubstitutionTeacher;
	}

	public createTeacherStatusForUser(user: User): ITaskStatus {
		const submitted = this.getListOfSubmittedUserIds().length;
		const graded = this.getListOfGradeddUserIds().length;
		const maxSubmissions = this.getStudentIds().length;
		const isDraft = this.isDraft();
		const isFinished = this.isFinishedForUser(user);
		const isSubstitutionTeacher = this.userIsSubstitutionTeacher(user);

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

	public createStudentStatusForUser(user: User): ITaskStatus {
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
		};

		return status;
	}

	// TODO: based on the parent relationship
	public getParentData(): TaskParentDescriptions {
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

	public finishForUser(user: User) {
		this.finished.add(user);
	}

	public restoreForUser(user: User) {
		this.finished.remove(user);
	}

	public getSchoolId(): EntityId {
		return this.school.id;
	}

	public publish() {
		this.private = false;
		this.availableDate = new Date(Date.now());
	}

	public unpublish() {
		this.private = true;
	}
}
