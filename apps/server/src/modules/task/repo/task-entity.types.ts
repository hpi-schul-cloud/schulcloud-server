import type { Collection } from '@mikro-orm/core';
import type { User } from '@modules/user/repo/user.entity';
import type { EntityId, InputFormat } from '@shared/domain/types';
import type { ITask } from '../domain/interface/task.types';

export interface TaskParent {
	getStudentIds(): EntityId[];
}

export interface TaskStateLike {
	isDraft(): boolean;
	isPublished(): boolean;
	isPlanned(): boolean;
}

export interface TaskSchoolLike {
	id: EntityId;
}

export interface TaskCourseLike {
	name: string;
	color: string;
	isFinished(): boolean;
	isUserSubstitutionTeacher(user: User): boolean;
	getStudentIds(): EntityId[];
}

export interface TaskLessonLike {
	name: string;
	hidden: boolean;
}

export interface TaskCourseGroupLike {
	course: TaskCourseLike;
}

export interface SubmissionLike {
	id: EntityId;
	isSubmitted(): boolean;
	isGraded(): boolean;
	isSubmittedForUser(user: User): boolean;
	isGradedForUser(user: User): boolean;
	getSubmitterIds(): EntityId[];
}

export interface TaskLike {
	id: EntityId;
	name: string;
	description: string;
	descriptionInputFormat: InputFormat;
	availableDate?: Date;
	dueDate?: Date;
	private?: boolean;
	publicSubmissions?: boolean;
	teamSubmissions?: boolean;
	creator?: User;
	course?: TaskCourseLike;
	school: TaskSchoolLike;
	lesson?: TaskLessonLike;
	getParentData(): { courseName: string; courseId: string; lessonName: string; lessonHidden: boolean; color: string };
	submissions: Collection<SubmissionLike>;
	finished: Collection<User>;
}

export interface TaskProperties extends ITask {
	course?: TaskCourseLike;
	lesson?: TaskLessonLike;
	creator: User;
	school: TaskSchoolLike;
	finished?: User[];
	private?: boolean;
	submissions?: SubmissionLike[];
	publicSubmissions?: boolean;
	teamSubmissions?: boolean;
}

export interface SubmissionProperties {
	school: TaskSchoolLike;
	task: TaskLike;
	student?: User;
	courseGroup?: TaskCourseGroupLike;
	teamMembers?: User[];
	comment: string;
	submitted?: boolean;
	graded?: boolean;
	grade?: number;
	gradeComment?: string;
}
