import { Collection, Entity, Index, ManyToMany, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { InternalServerErrorException } from '@nestjs/common';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { InputFormat } from '@shared/domain/types/input-format.types';
import type { EntityWithSchool } from '../interface';
import type { LearnroomElement } from '../interface/learnroom';
import type { EntityId } from '../types/entity-id';
import type { TaskProperties, TaskStatus } from '../types/task.types';
import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';
import type { LessonEntity } from './lesson.entity';
import type { Submission } from './submission.entity';
import { User } from './user.entity';

export class TaskWithStatusVo {
	task!: Task;

	status!: TaskStatus;

	constructor(task: Task, status: TaskStatus) {
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

export interface TaskParent {
	getStudentIds(): EntityId[];
}

@Entity({ tableName: 'homeworks' })
@Index({ properties: ['private', 'dueDate', 'finished'] })
@Index({ properties: ['id', 'private'] })
@Index({ properties: ['finished', 'course'] })
@Index({ properties: ['finished', 'course'] })
export class Task extends BaseEntityWithTimestamps implements LearnroomElement, EntityWithSchool {
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

	@Property({ type: 'boolean' })
	private = true;

	@Property({ nullable: true })
	publicSubmissions?: boolean;

	@Property({ nullable: true })
	teamSubmissions?: boolean;

	@Index()
	@ManyToOne('User', { fieldName: 'teacherId', nullable: true })
	creator?: User;

	@Index()
	@ManyToOne('Course', { fieldName: 'courseId', nullable: true })
	course?: Course;

	@Index()
	@ManyToOne(() => SchoolEntity, { fieldName: 'schoolId' })
	school: SchoolEntity;

	@Index()
	@ManyToOne('LessonEntity', { fieldName: 'lessonId', nullable: true })
	lesson?: LessonEntity; // In database exist also null, but it can not set.

	@OneToMany('Submission', 'task')
	submissions = new Collection<Submission>(this);

	@Index()
	@ManyToMany('User', undefined, { fieldName: 'archived' })
	finished = new Collection<User>(this);

	constructor(props: TaskProperties) {
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
		this.publicSubmissions = props.publicSubmissions || false;
		this.teamSubmissions = props.teamSubmissions || false;
	}

	private getSubmissionItems(): Submission[] {
		if (!this.submissions || !this.submissions.isInitialized(true)) {
			throw new InternalServerErrorException('Submissions items are not loaded.');
		}
		const submissions = this.submissions.getItems();

		return submissions;
	}

	private getFinishedUserIds(): EntityId[] {
		if (!this.finished) {
			throw new InternalServerErrorException('Task.finished is undefined. The task need to be populated.');
		}

		const finishedObjectIds = this.finished.getIdentifiers('_id');
		const finishedIds = finishedObjectIds.map((id): string => id.toString());

		return finishedIds;
	}

	private getParent(): TaskParent | User | undefined {
		const parent = this.lesson || this.course || this.creator;

		return parent;
	}

	private getMaxSubmissions(): number {
		const parent = this.getParent();
		let maxSubmissions = 0;
		if (parent) {
			// For draft (user as parent) propaly user is not a student, but for maxSubmission one is valid result
			maxSubmissions = parent instanceof User ? 1 : parent.getStudentIds().length;
		}
		return maxSubmissions;
	}

	private isFinishedForUser(user: User): boolean {
		const finishedUserIds = this.getFinishedUserIds();
		const isUserInFinishedUser = finishedUserIds.some((finishedUserId) => finishedUserId === user.id);

		const isCourseFinished = this.course ? this.course.isFinished() : false;

		const isFinishedForUser = isUserInFinishedUser || isCourseFinished;

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
		if (this.availableDate && this.availableDate > new Date()) {
			return false;
		}

		return true;
	}

	public isPlanned(): boolean {
		if (this.isDraft()) {
			return false;
		}
		if (this.availableDate && this.availableDate > new Date()) {
			return true;
		}

		return false;
	}

	private getSubmittedSubmissions(): Submission[] {
		const submissions = this.getSubmissionItems();
		const submittedSubmissions = submissions.filter((submission) => submission.isSubmitted());

		return submittedSubmissions;
	}

	public areSubmissionsPublic(): boolean {
		const areSubmissionsPublic = !!this.publicSubmissions;

		return areSubmissionsPublic;
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
		const isGraded = submissions.some((submission) => submission.isGradedForUser(user));

		return isGraded;
	}

	private calculateNumberOfSubmitters(submissions: Submission[]): number {
		let taskSubmitterIds: EntityId[] = [];

		submissions.forEach((submission) => {
			const submitterIds = submission.getSubmitterIds();
			taskSubmitterIds = [...taskSubmitterIds, ...submitterIds];
		});

		const uniqueIds = [...new Set(taskSubmitterIds)];
		const numberOfSubmitters = uniqueIds.length;

		return numberOfSubmitters;
	}

	private isUserSubstitutionTeacherInCourse(user: User): boolean {
		const isSubstitutionTeacher = this.course ? this.course.isUserSubstitutionTeacher(user) : false;

		return isSubstitutionTeacher;
	}

	public createTeacherStatusForUser(user: User): TaskStatus {
		const submittedSubmissions = this.getSubmittedSubmissions();
		const gradedSubmissions = this.getGradedSubmissions();

		const numberOfSubmitters = this.calculateNumberOfSubmitters(submittedSubmissions);
		const numberOfSubmittersWithGrade = this.calculateNumberOfSubmitters(gradedSubmissions);
		const maxSubmissions = this.getMaxSubmissions();
		const isDraft = this.isDraft();
		const isFinished = this.isFinishedForUser(user);
		const isSubstitutionTeacher = this.isUserSubstitutionTeacherInCourse(user);

		const status = {
			submitted: numberOfSubmitters,
			graded: numberOfSubmittersWithGrade,
			maxSubmissions,
			isDraft,
			isSubstitutionTeacher,
			isFinished,
		};

		return status;
	}

	public createStudentStatusForUser(user: User): TaskStatus {
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

	public finishForUser(user: User): void {
		this.finished.add(user);
	}

	public restoreForUser(user: User): void {
		this.finished.remove(user);
	}

	public getSchoolId(): EntityId {
		return this.school.id;
	}

	public publish(): void {
		this.private = false;
		this.availableDate = new Date();
	}

	public unpublish(): void {
		this.private = true;
	}

	public removeCreatorId(): void {
		this.creator = undefined;
	}

	public removeUserFromFinished(userId: EntityId): void {
		this.finished.remove((u) => u.id === userId);
	}
}

export function isTask(reference: unknown): reference is Task {
	return reference instanceof Task;
}
